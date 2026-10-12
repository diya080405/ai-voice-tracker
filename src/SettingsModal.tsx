import React, { useState, useEffect } from 'react';
import { AppSettings, ElevenLabsVoice, AssistantPersona, BackendStatus } from '../types';
import {
  X,
  Volume2,
  Key,
  Sliders,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  voices: ElevenLabsVoice[];
  backendStatus: BackendStatus | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  voices,
  backendStatus,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    valid: boolean;
    error?: string;
    subscription?: Record<string, unknown>;
  } | null>(null);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleResetDefaults = () => {
    setLocalSettings((prev) => ({
      ...prev,
      voiceSettings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true,
      },
    }));
  };

  const handleTestKey = async () => {
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/elevenlabs/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: localSettings.customApiKey }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setTestResult({ valid: true, subscription: data.subscription });
      } else {
        setTestResult({ valid: false, error: data.error || 'Invalid API key or unauthorized.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network test error';
      setTestResult({ valid: false, error: msg });
    } finally {
      setTestingKey(false);
    }
  };

  const playVoicePreview = (url?: string, voiceId?: string) => {
    if (!url) return;
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    if (playingPreviewId === voiceId) {
      setPlayingPreviewId(null);
      return;
    }
    const audio = new Audio(url);
    previewAudioRef.current = audio;
    setPlayingPreviewId(voiceId || null);
    audio.play().catch(() => setPlayingPreviewId(null));
    audio.onended = () => setPlayingPreviewId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Voice & Model Settings</h2>
              <p className="text-xs text-slate-400">Configure ElevenLabs synthesis, AI persona, and conversation parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* 1. Voice Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-purple-400" />
                ElevenLabs Voice
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {voices.length} voices available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {voices.map((voice) => {
                const isSelected = localSettings.voiceId === voice.voice_id;
                const isPlaying = playingPreviewId === voice.voice_id;

                return (
                  <div
                    key={voice.voice_id}
                    onClick={() => setLocalSettings({ ...localSettings, voiceId: voice.voice_id })}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500/80 ring-1 ring-purple-500 text-white'
                        : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm text-slate-100">{voice.name}</span>
                        {voice.labels?.accent && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {voice.labels.accent}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {voice.description || 'ElevenLabs voice'}
                      </p>
                    </div>

                    {voice.preview_url && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playVoicePreview(voice.preview_url, voice.voice_id);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                          isPlaying
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-slate-800/80 hover:bg-purple-600/30 text-slate-400 hover:text-purple-300 border-slate-700/60'
                        }`}
                        title="Listen to voice sample"
                      >
                        <Play className={`w-3.5 h-3.5 ${isPlaying ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Model Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              ElevenLabs Model
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, modelId: 'eleven_turbo_v2_5' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  localSettings.modelId === 'eleven_turbo_v2_5'
                    ? 'bg-cyan-950/40 border-cyan-500/80 ring-1 ring-cyan-500'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80'
                }`}
              >
                <div className="font-medium text-sm text-white">Turbo v2.5 (Recommended)</div>
                <div className="text-[11px] text-slate-400 mt-1">Lowest latency, optimized for real-time dialogue</div>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, modelId: 'eleven_multilingual_v2' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  localSettings.modelId === 'eleven_multilingual_v2'
                    ? 'bg-cyan-950/40 border-cyan-500/80 ring-1 ring-cyan-500'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80'
                }`}
              >
                <div className="font-medium text-sm text-white">Multilingual v2</div>
                <div className="text-[11px] text-slate-400 mt-1">Rich expression across 29+ languages</div>
              </button>
            </div>
          </div>

          {/* 3. Voice Synthesis Parameters */}
          <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Voice Parameters
              </span>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Stability */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Stability</span>
                  <span className="font-mono text-indigo-400">
                    {Math.round(localSettings.voiceSettings.stability * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localSettings.voiceSettings.stability}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      voiceSettings: {
                        ...localSettings.voiceSettings,
                        stability: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">More variable vs more consistent</span>
              </div>

              {/* Similarity Boost */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Similarity / Clarity</span>
                  <span className="font-mono text-indigo-400">
                    {Math.round(localSettings.voiceSettings.similarity_boost * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localSettings.voiceSettings.similarity_boost}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      voiceSettings: {
                        ...localSettings.voiceSettings,
                        similarity_boost: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Enhances original voice likeness</span>
              </div>

              {/* Style Exaggeration */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Style Exaggeration</span>
                  <span className="font-mono text-indigo-400">
                    {Math.round(localSettings.voiceSettings.style * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localSettings.voiceSettings.style}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      voiceSettings: {
                        ...localSettings.voiceSettings,
                        style: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Expressive dramatic intensity</span>
              </div>

              {/* Speaker Boost toggle */}
              <div className="flex items-center justify-between pt-3">
                <div>
                  <div className="text-xs font-medium text-slate-300">Speaker Boost</div>
                  <div className="text-[10px] text-slate-500">Enhances vocal presence</div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.voiceSettings.use_speaker_boost}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      voiceSettings: {
                        ...localSettings.voiceSettings,
                        use_speaker_boost: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 4. Assistant Persona */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Assistant Persona
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'friendly', label: 'Friendly & Warm', desc: 'Empathetic & conversational' },
                  { id: 'professional', label: 'Executive', desc: 'Polished & concise' },
                  { id: 'concise', label: 'Ultra-Brief', desc: '1-2 sentences maximum' },
                  { id: 'creative', label: 'Creative', desc: 'Vivid & curious' },
                  { id: 'tutor', label: 'Mentor', desc: 'Encouraging & insightful' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, persona: p.id as AssistantPersona })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    localSettings.persona === p.id
                      ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 text-white'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="font-medium text-xs text-slate-100">{p.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Conversational Flow Controls */}
          <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Two-Way Conversation Flow
            </span>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-slate-200">Continuous Auto-Listen</div>
                  <div className="text-[11px] text-slate-500">
                    Automatically reopen microphone after assistant finishes speaking
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.autoListen}
                  onChange={(e) => setLocalSettings({ ...localSettings, autoListen: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-slate-200">Natural Voice Interruption</div>
                  <div className="text-[11px] text-slate-500">
                    Immediately stop AI playback when you start speaking
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.enableInterruption}
                  onChange={(e) => setLocalSettings({ ...localSettings, enableInterruption: e.target.checked })}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </label>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Silence Detection Delay</span>
                  <span className="font-mono text-cyan-400">
                    {localSettings.silenceThresholdSeconds}s
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="3.0"
                  step="0.2"
                  value={localSettings.silenceThresholdSeconds}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      silenceThresholdSeconds: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Fast response (0.8s)</span>
                  <span>More time to pause (3.0s)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. ElevenLabs API Key Configuration */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                ElevenLabs API Key
              </label>
              {backendStatus?.elevenlabsConfigured && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Configured on Server
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              If not configured in your server <code className="text-purple-300 font-mono">.env</code> file, you can enter your ElevenLabs API key here. It remains securely in your current browser session.
            </p>

            <div className="flex gap-2">
              <input
                type="password"
                value={localSettings.customApiKey}
                onChange={(e) => setLocalSettings({ ...localSettings, customApiKey: e.target.value })}
                placeholder="sk_... or xi-api-key"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testingKey}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 disabled:opacity-50 transition-colors shrink-0"
              >
                {testingKey ? 'Verifying...' : 'Test Key'}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  testResult.valid
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                }`}
              >
                {testResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">
                    {testResult.valid ? 'ElevenLabs Key Validated!' : 'Validation Failed'}
                  </div>
                  <div className="text-[11px] mt-0.5 text-slate-300">
                    {testResult.valid
                      ? 'Authentication successful. You can use all ElevenLabs voices and models.'
                      : testResult.error}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40">
          <a
            href="https://elevenlabs.io/app/settings/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 hover:underline"
          >
            Get ElevenLabs Key ↗
          </a>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/40 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
