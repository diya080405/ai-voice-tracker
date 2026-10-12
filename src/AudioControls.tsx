import React, { useState } from 'react';
import { VoiceAssistantState } from '../types';
import { Mic, MicOff, PhoneCall, PhoneOff, Send, Square, Sparkles } from 'lucide-react';

interface AudioControlsProps {
  state: VoiceAssistantState;
  isMuted: boolean;
  onToggleConversation: () => void;
  onToggleMute: () => void;
  onInterrupt: () => void;
  onSendMessage: (text: string) => void;
}

const QUICK_PROMPTS = [
  'How are you today?',
  'Explain quantum computing simply',
  'Tell me a fun science fact',
  'Help me brainstorm a catchy project name',
];

export const AudioControls: React.FC<AudioControlsProps> = ({
  state,
  isMuted,
  onToggleConversation,
  onToggleMute,
  onInterrupt,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const isActive = state !== 'idle';
  const isSpeaking = state === 'speaking';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handlePromptClick = (prompt: string) => {
    onSendMessage(prompt);
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {/* Primary Voice Action Buttons */}
      <div className="flex items-center gap-4">
        {/* Mute Button (Available when in conversation) */}
        {isActive && (
          <button
            onClick={onToggleMute}
            className={`p-3.5 rounded-full border transition-all duration-200 shadow-lg ${
              isMuted
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 hover:bg-amber-500/30 ring-2 ring-amber-500/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/80'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}

        {/* Start / End Conversation Main CTA */}
        <button
          onClick={onToggleConversation}
          className={`group relative flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-base transition-all duration-300 shadow-2xl active:scale-95 ${
            isActive
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950/50 hover:shadow-rose-600/30'
              : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-400 text-white shadow-purple-950/60 hover:shadow-purple-500/40 glow-purple hover:scale-[1.02]'
          }`}
        >
          {isActive ? (
            <>
              <PhoneOff className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span>End Conversation</span>
            </>
          ) : (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-300" />
              </span>
              <PhoneCall className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>Start Conversation</span>
            </>
          )}
        </button>

        {/* Interrupt / Stop Speaking Button (visible when assistant is speaking) */}
        {isSpeaking && (
          <button
            onClick={onInterrupt}
            className="flex items-center gap-1.5 px-4 py-3.5 rounded-full bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-lg animate-pulse"
            title="Interrupt AI speaking and speak now"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Interrupt</span>
          </button>
        )}
      </div>

      {/* Text Input Fallback */}
      <div className="w-full max-w-xl">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isActive
                ? 'Type a message (or just speak naturally)...'
                : 'Type here or click Start Conversation above...'
            }
            className="w-full bg-slate-900/70 border border-slate-800 rounded-full pl-5 pr-12 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/50 backdrop-blur-md transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || state === 'processing'}
            className="absolute right-2 p-2 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:hover:bg-purple-600 text-white transition-all"
            title="Send text message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Quick starter suggestions */}
        {!isActive && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Try asking:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/40 text-slate-300 hover:text-purple-300 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
