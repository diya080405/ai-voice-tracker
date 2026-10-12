import React from 'react';
import { X, Key, Mic, ShieldCheck, Zap, HelpCircle } from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Voxa AI Guide & Architecture</h2>
              <p className="text-xs text-slate-400">Learn how natural voice conversation works</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-300">
          {/* Section 1: How Voice Conversation Works */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              1. Continuous Two-Way Dialogue
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When you click <strong className="text-white">&quot;Start Conversation&quot;</strong>, Voxa AI continuously listens to your speech. When you stop speaking, it automatically detects silence, understands your intent with Gemini conversational intelligence, synthesizes speech with ElevenLabs, and plays the response. When playback finishes, it immediately resumes listening without any button clicks!
            </p>
          </div>

          {/* Section 2: Speech Interruption */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-cyan-400" />
              2. Natural Voice Interruption
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If Voxa is currently speaking and you start talking or click &quot;Interrupt&quot;, the audio playback stops instantly and Voxa focuses on what you are saying next.
            </p>
          </div>

          {/* Section 3: Setting Up ElevenLabs */}
          <div className="space-y-2 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              3. ElevenLabs API Setup
            </h3>
            <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                Create an account at{' '}
                <a
                  href="https://elevenlabs.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 underline"
                >
                  elevenlabs.io
                </a>
              </li>
              <li>
                Navigate to <strong>Settings → API Keys</strong> and generate a key.
              </li>
              <li>
                Add <code className="text-purple-300 font-mono">ELEVENLABS_API_KEY=&quot;your_key&quot;</code> to your <code className="text-purple-300 font-mono">.env</code> file, or paste it in <strong>Settings</strong>.
              </li>
              <li>
                <em>Note:</em> If your key is not yet set, Voxa uses an intelligent high-fidelity fallback voice so you can test conversational mechanics immediately.
              </li>
            </ol>
          </div>

          {/* Section 4: Privacy */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              4. Privacy & Security
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Microphone access is requested only upon explicit user gesture (&quot;Start Conversation&quot;). Audio streams and audio buffers are processed in temporary memory and never stored permanently on disks or public endpoints. API keys are handled securely server-side.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            Configure Voice & Keys →
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
