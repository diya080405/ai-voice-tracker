/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { AudioVisualizerCanvas } from './components/AudioVisualizerCanvas';
import { VoiceStatusBadge } from './components/VoiceStatusBadge';
import { ConversationTranscript } from './components/ConversationTranscript';
import { AudioControls } from './components/AudioControls';
import { SettingsModal } from './components/SettingsModal';
import { SetupGuideModal } from './components/SetupGuideModal';
import { AppSettings } from './types';
import {
  Sliders,
  HelpCircle,
  Radio,
  Sparkles,
  AlertCircle,
  X,
  Volume2,
} from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
  modelId: 'eleven_turbo_v2_5',
  persona: 'friendly',
  customApiKey: '',
  autoListen: true,
  enableInterruption: true,
  silenceThresholdSeconds: 1.4,
  voiceSettings: {
    stability: 0.5,
    similarity_boost: 0.8,
    style: 0.0,
    use_speaker_boost: true,
  },
};

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('voxa_ai_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isDismissedWarning, setIsDismissedWarning] = useState(false);

  const {
    state,
    messages,
    isMuted,
    transcriptDraft,
    errorMessage,
    playingMessageId,
    activeAnalyser,
    voices,
    backendStatus,
    toggleConversation,
    toggleMute,
    handleInterrupt,
    processUserMessage,
    replayMessageAudio,
    clearHistory,
  } = useVoiceAssistant(settings);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('voxa_ai_settings', JSON.stringify(newSettings));
    } catch {
      // ignore
    }
  };

  const currentVoice = voices.find((v) => v.voice_id === settings.voiceId);

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Background ambient neon gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-purple-900/15 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-900/15 blur-[140px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-cyan-900/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Main Top Header */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-900/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Radio className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-200 bg-clip-text text-transparent">
                Voxa AI
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 tracking-wider uppercase font-mono">
                ElevenLabs Voice
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Conversational Voice Intelligence
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Voice Pill */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            title="Current Voice"
          >
            <Volume2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-medium">{currentVoice?.name || 'Rachel'}</span>
            <span className="text-[10px] text-slate-500 font-mono">
              ({settings.modelId.includes('turbo') ? 'Turbo' : 'Multilingual'})
            </span>
          </button>

          {/* Guide Button */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            title="Setup & Privacy Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Guide</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            title="Settings"
          >
            <Sliders className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Information Banner (if ElevenLabs key is not configured on server) */}
      {!backendStatus?.elevenlabsConfigured && !settings.customApiKey && !isDismissedWarning && (
        <div className="relative z-10 bg-gradient-to-r from-purple-950/70 via-indigo-950/70 to-slate-900/70 border-b border-purple-500/20 px-4 py-2 text-xs flex items-center justify-between text-purple-200 backdrop-blur-md">
          <div className="flex items-center gap-2 max-w-4xl">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              <strong>ElevenLabs Voice Ready:</strong> Using intelligent fallback voice until you connect your ElevenLabs key. Add it in <button onClick={() => setIsSettingsOpen(true)} className="underline hover:text-white font-medium">Settings</button> or set <code className="bg-slate-900/80 px-1 py-0.5 rounded text-purple-300 font-mono text-[11px]">ELEVENLABS_API_KEY</code> in .env.
            </span>
          </div>
          <button
            onClick={() => setIsDismissedWarning(true)}
            className="p-1 hover:text-white text-purple-300"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="relative z-10 mx-4 sm:mx-8 mt-3 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 backdrop-blur-md shadow-lg animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Notice:</span> {errorMessage}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Left Column: Visual Voice Stage & Interactive Controls */}
        <section className="lg:col-span-7 flex flex-col items-center justify-between space-y-6">
          {/* Status Indicator Pill */}
          <div className="pt-2">
            <VoiceStatusBadge
              state={state}
              isMuted={isMuted}
              transcriptDraft={transcriptDraft}
            />
          </div>

          {/* Central Audio Reactive Visualizer Sphere */}
          <div className="relative flex flex-col items-center justify-center my-auto py-2">
            <AudioVisualizerCanvas
              state={state}
              analyserNode={activeAnalyser}
              isMuted={isMuted}
              size={300}
            />

            {/* Live Subtitle readout under visualizer */}
            <div className="mt-4 min-h-12 max-w-md text-center px-4">
              {transcriptDraft ? (
                <div className="inline-block px-4 py-2 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-sm font-medium shadow-md backdrop-blur-md animate-in fade-in">
                  <span className="text-cyan-400 text-xs mr-1.5 font-bold uppercase tracking-wider">Hearing:</span>
                  &ldquo;{transcriptDraft}&rdquo;
                </div>
              ) : state === 'speaking' ? (
                <div className="inline-block px-4 py-2 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs font-medium shadow-md backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-purple-400 inline-block mr-2 animate-ping" />
                  Speaking with ElevenLabs Voice... Speak anytime to interrupt.
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  {state === 'listening'
                    ? 'Natural microphone listening active... speak naturally.'
                    : 'Click Start Conversation to experience two-way voice dialogue.'}
                </p>
              )}
            </div>
          </div>

          {/* Action Control Bar */}
          <div className="w-full pb-2">
            <AudioControls
              state={state}
              isMuted={isMuted}
              onToggleConversation={toggleConversation}
              onToggleMute={toggleMute}
              onInterrupt={handleInterrupt}
              onSendMessage={processUserMessage}
            />
          </div>
        </section>

        {/* Right Column: Live Conversation Transcript */}
        <section className="lg:col-span-5 h-[520px] lg:h-[calc(100vh-140px)] flex flex-col">
          <ConversationTranscript
            messages={messages}
            transcriptDraft={transcriptDraft}
            isListening={state === 'listening'}
            onReplayAudio={replayMessageAudio}
            onClearHistory={clearHistory}
            playingMessageId={playingMessageId}
          />
        </section>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        voices={voices}
        backendStatus={backendStatus}
      />

      {/* Architecture & Help Modal */}
      <SetupGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenSettings={() => {
          setIsGuideOpen(false);
          setIsSettingsOpen(true);
        }}
      />
    </div>
  );
}
