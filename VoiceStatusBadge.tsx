import React from 'react';
import { VoiceAssistantState } from '../types';
import { Mic, Volume2, Sparkles, AlertCircle, StopCircle, Radio } from 'lucide-react';

interface VoiceStatusBadgeProps {
  state: VoiceAssistantState;
  isMuted: boolean;
  transcriptDraft?: string;
}

export const VoiceStatusBadge: React.FC<VoiceStatusBadgeProps> = ({
  state,
  isMuted,
  transcriptDraft,
}) => {
  const getStatusConfig = () => {
    if (isMuted && state !== 'idle') {
      return {
        label: 'Microphone Muted',
        subtext: 'Unmute to speak',
        dotColor: 'bg-amber-400',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-300',
        bgColor: 'bg-amber-950/40',
        icon: Mic,
      };
    }

    switch (state) {
      case 'listening':
        return {
          label: 'Listening',
          subtext: transcriptDraft ? `"${transcriptDraft}"` : 'Speak naturally anytime...',
          dotColor: 'bg-cyan-400 animate-ping',
          borderColor: 'border-cyan-500/40',
          textColor: 'text-cyan-300',
          bgColor: 'bg-cyan-950/50',
          icon: Radio,
        };
      case 'processing':
        return {
          label: 'Processing',
          subtext: 'Generating response...',
          dotColor: 'bg-amber-400 animate-pulse',
          borderColor: 'border-amber-500/40',
          textColor: 'text-amber-300',
          bgColor: 'bg-amber-950/50',
          icon: Sparkles,
        };
      case 'speaking':
        return {
          label: 'Speaking',
          subtext: 'You can speak to interrupt...',
          dotColor: 'bg-purple-400 animate-pulse',
          borderColor: 'border-purple-500/40',
          textColor: 'text-purple-300',
          bgColor: 'bg-purple-950/50',
          icon: Volume2,
        };
      case 'interrupted':
        return {
          label: 'Interrupted',
          subtext: 'Stopped speech, ready for you',
          dotColor: 'bg-rose-400',
          borderColor: 'border-rose-500/40',
          textColor: 'text-rose-300',
          bgColor: 'bg-rose-950/50',
          icon: StopCircle,
        };
      case 'error':
        return {
          label: 'Attention Needed',
          subtext: 'Check microphone or API credentials',
          dotColor: 'bg-rose-500',
          borderColor: 'border-rose-500/50',
          textColor: 'text-rose-300',
          bgColor: 'bg-rose-950/60',
          icon: AlertCircle,
        };
      case 'idle':
      default:
        return {
          label: 'Ready',
          subtext: 'Click Start to begin continuous conversation',
          dotColor: 'bg-indigo-400',
          borderColor: 'border-indigo-500/30',
          textColor: 'text-indigo-300',
          bgColor: 'bg-indigo-950/40',
          icon: Sparkles,
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className="flex flex-col items-center text-center space-y-1.5 transition-all duration-300">
      <div
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-md transition-all shadow-sm ${config.bgColor} ${config.borderColor}`}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotColor}`}
          />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`} />
        </span>
        <IconComponent className={`w-3.5 h-3.5 ${config.textColor}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${config.textColor}`}>
          {config.label}
        </span>
      </div>
      <p className="text-xs text-slate-400 max-w-sm truncate h-4 font-mono">
        {config.subtext}
      </p>
    </div>
  );
};
