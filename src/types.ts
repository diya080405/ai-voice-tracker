export type VoiceAssistantState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'interrupted'
  | 'error';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  audioBlobUrl?: string;
  engine?: 'elevenlabs' | 'gemini-fallback' | 'web-speech';
  audioDuration?: number;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  labels?: Record<string, string>;
  preview_url?: string;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export type AssistantPersona =
  | 'friendly'
  | 'professional'
  | 'concise'
  | 'creative'
  | 'tutor';

export interface AppSettings {
  voiceId: string;
  modelId: string;
  persona: AssistantPersona;
  customApiKey: string;
  autoListen: boolean;
  enableInterruption: boolean;
  silenceThresholdSeconds: number;
  voiceSettings: VoiceSettings;
}

export interface BackendStatus {
  status: string;
  elevenlabsConfigured: boolean;
  geminiConfigured: boolean;
  hasAgentId: boolean;
  environment: string;
}

export interface AudioVisualizerData {
  volume: number; // 0 to 1
  frequencies: Uint8Array;
  isSpeaking: boolean;
  isListening: boolean;
}
