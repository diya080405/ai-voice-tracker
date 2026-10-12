import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { Volume2, Copy, Check, User, Bot, Trash2 } from 'lucide-react';

interface ConversationTranscriptProps {
  messages: Message[];
  transcriptDraft: string;
  isListening: boolean;
  onReplayAudio: (message: Message) => void;
  onClearHistory: () => void;
  playingMessageId: string | null;
}

export const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({
  messages,
  transcriptDraft,
  isListening,
  onReplayAudio,
  onClearHistory,
  playingMessageId,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Auto-scroll to bottom on new messages or active draft
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, transcriptDraft]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Live Transcript
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {messages.length} {messages.length === 1 ? 'turn' : 'turns'}
          </span>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded hover:bg-slate-800/60"
            title="Clear transcript history"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Messages scroll area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 text-sm"
      >
        {messages.length === 0 && !transcriptDraft && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Bot className="w-10 h-10 mb-3 text-slate-600 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-400 mb-1">
              No conversation messages yet
            </p>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Click &quot;Start Conversation&quot; and speak into your microphone, or type a message below.
            </p>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.role === 'user';
          const isPlaying = playingMessageId === message.id;

          return (
            <div
              key={message.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-500">
                {isUser ? (
                  <>
                    <span>{formatTime(message.timestamp)}</span>
                    <span className="font-medium text-cyan-400">You</span>
                    <User className="w-3 h-3 text-cyan-400" />
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-purple-400" />
                    <span className="font-medium text-purple-400">Voxa AI</span>
                    {message.engine === 'elevenlabs' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 font-mono">
                        ElevenLabs
                      </span>
                    )}
                    {message.engine === 'gemini-fallback' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 font-mono">
                        Gemini TTS
                      </span>
                    )}
                    <span>{formatTime(message.timestamp)}</span>
                  </>
                )}
              </div>

              <div
                className={`relative max-w-[85%] rounded-2xl px-4 py-2.5 text-slate-100 shadow-md ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600/90 to-blue-600/90 text-white rounded-tr-sm'
                    : 'bg-slate-800/90 border border-slate-700/60 rounded-tl-sm text-slate-200'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>

                {/* Bubble action toolbar */}
                <div
                  className={`flex items-center gap-1 mt-2 pt-1 border-t ${
                    isUser ? 'border-cyan-400/20 justify-end' : 'border-slate-700/40 justify-start'
                  } opacity-80 group-hover:opacity-100 transition-opacity`}
                >
                  <button
                    onClick={() => handleCopy(message.id, message.text)}
                    className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    title="Copy message"
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>

                  {!isUser && message.audioBlobUrl && (
                    <button
                      onClick={() => onReplayAudio(message)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        isPlaying
                          ? 'bg-purple-600 text-white animate-pulse'
                          : 'bg-slate-700/60 hover:bg-purple-600/60 text-slate-300 hover:text-white'
                      }`}
                      title="Replay spoken audio"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{isPlaying ? 'Playing...' : 'Replay'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live speech utterance preview in progress */}
        {isListening && transcriptDraft && (
          <div className="flex flex-col items-end animate-pulse">
            <div className="flex items-center gap-1 mb-1 text-[11px] text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Transcribing live...</span>
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2 bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 italic shadow-sm">
              {transcriptDraft}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
