import React, { useEffect, useRef } from 'react';
import { VoiceAssistantState } from '../types';

interface AudioVisualizerCanvasProps {
  state: VoiceAssistantState;
  analyserNode: AnalyserNode | null;
  isMuted: boolean;
  size?: number;
}

export const AudioVisualizerCanvas: React.FC<AudioVisualizerCanvasProps> = ({
  state,
  analyserNode,
  isMuted,
  size = 280,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomainArray = new Uint8Array(bufferLength);

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;
      const baseRadius = size * 0.28;

      let volume = 0;

      if (analyserNode && !isMuted && (state === 'listening' || state === 'speaking')) {
        analyserNode.getByteFrequencyData(dataArray);
        analyserNode.getByteTimeDomainData(timeDomainArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        volume = sum / (bufferLength * 255); // 0 to 1
      }

      phase += 0.04;

      // Draw outer ambient glow
      const ambientGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.4,
        centerX,
        centerY,
        baseRadius * 1.8
      );

      if (state === 'speaking') {
        ambientGlow.addColorStop(0, `rgba(168, 85, 247, ${0.25 + volume * 0.45})`);
        ambientGlow.addColorStop(0.5, `rgba(139, 92, 246, ${0.15 + volume * 0.3})`);
        ambientGlow.addColorStop(1, 'rgba(124, 58, 237, 0)');
      } else if (state === 'listening') {
        ambientGlow.addColorStop(0, `rgba(6, 182, 212, ${0.25 + volume * 0.5})`);
        ambientGlow.addColorStop(0.5, `rgba(59, 130, 246, ${0.15 + volume * 0.35})`);
        ambientGlow.addColorStop(1, 'rgba(37, 99, 235, 0)');
      } else if (state === 'processing') {
        ambientGlow.addColorStop(0, `rgba(245, 158, 11, ${0.25 + Math.sin(phase * 2) * 0.1})`);
        ambientGlow.addColorStop(0.6, 'rgba(217, 119, 6, 0.1)');
        ambientGlow.addColorStop(1, 'rgba(180, 83, 9, 0)');
      } else {
        // Idle
        ambientGlow.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
        ambientGlow.addColorStop(0.7, 'rgba(79, 70, 229, 0.05)');
        ambientGlow.addColorStop(1, 'rgba(67, 56, 202, 0)');
      }

      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Draw frequency / wave spikes around the circle
      const numPoints = 48;
      const angleStep = (Math.PI * 2) / numPoints;

      ctx.save();
      ctx.beginPath();

      for (let i = 0; i <= numPoints; i++) {
        const angle = i * angleStep;
        let radiusOffset = 0;

        if ((state === 'listening' || state === 'speaking') && analyserNode && !isMuted) {
          const sampleIndex = Math.floor((i % numPoints) * (bufferLength / numPoints));
          const freqVal = dataArray[sampleIndex] || 0;
          radiusOffset = (freqVal / 255) * (size * 0.22);
        } else if (state === 'processing') {
          radiusOffset = Math.sin(angle * 4 + phase * 3) * (size * 0.06);
        } else {
          // Idle breathing
          radiusOffset = Math.sin(angle * 3 + phase) * (size * 0.02);
        }

        const currentRadius = baseRadius + radiusOffset;
        const x = centerX + Math.cos(angle) * currentRadius;
        const y = centerY + Math.sin(angle) * currentRadius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();

      // Gradient stroke for perimeter
      const ringGradient = ctx.createLinearGradient(0, 0, size, size);
      if (state === 'speaking') {
        ringGradient.addColorStop(0, '#c084fc');
        ringGradient.addColorStop(0.5, '#ec4899');
        ringGradient.addColorStop(1, '#a855f7');
      } else if (state === 'listening') {
        ringGradient.addColorStop(0, '#22d3ee');
        ringGradient.addColorStop(0.5, '#3b82f6');
        ringGradient.addColorStop(1, '#6366f1');
      } else if (state === 'processing') {
        ringGradient.addColorStop(0, '#f59e0b');
        ringGradient.addColorStop(0.5, '#fbbf24');
        ringGradient.addColorStop(1, '#d97706');
      } else {
        ringGradient.addColorStop(0, '#6366f1');
        ringGradient.addColorStop(0.5, '#818cf8');
        ringGradient.addColorStop(1, '#4f46e5');
      }

      ctx.strokeStyle = ringGradient;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner Core sphere
      const coreGradient = ctx.createRadialGradient(
        centerX - baseRadius * 0.3,
        centerY - baseRadius * 0.3,
        baseRadius * 0.1,
        centerX,
        centerY,
        baseRadius * 0.85
      );

      if (state === 'speaking') {
        coreGradient.addColorStop(0, '#f472b6');
        coreGradient.addColorStop(0.4, '#a855f7');
        coreGradient.addColorStop(1, '#581c87');
      } else if (state === 'listening') {
        coreGradient.addColorStop(0, '#67e8f9');
        coreGradient.addColorStop(0.4, '#0284c7');
        coreGradient.addColorStop(1, '#1e1b4b');
      } else if (state === 'processing') {
        coreGradient.addColorStop(0, '#fcd34d');
        coreGradient.addColorStop(0.4, '#d97706');
        coreGradient.addColorStop(1, '#451a03');
      } else {
        coreGradient.addColorStop(0, '#a5b4fc');
        coreGradient.addColorStop(0.5, '#4f46e5');
        coreGradient.addColorStop(1, '#0f172a');
      }

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      const innerCoreScale = 0.82 + (state === 'speaking' || state === 'listening' ? volume * 0.25 : Math.sin(phase) * 0.04);
      ctx.arc(centerX, centerY, baseRadius * innerCoreScale, 0, Math.PI * 2);
      ctx.fill();

      // Additional dynamic radial ripples when active
      if (volume > 0.08) {
        ctx.beginPath();
        const rippleRadius = baseRadius * (1.1 + volume * 0.8);
        ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = state === 'speaking'
          ? `rgba(236, 72, 153, ${Math.max(0, 0.7 - volume)})`
          : `rgba(6, 182, 212, ${Math.max(0, 0.7 - volume)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state, analyserNode, isMuted, size]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="pointer-events-none drop-shadow-2xl"
      />
    </div>
  );
};
