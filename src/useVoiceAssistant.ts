import { useState, useRef, useEffect, useCallback } from 'react';
import {
  VoiceAssistantState,
  Message,
  AppSettings,
  ElevenLabsVoice,
  BackendStatus,
} from '../types';

// Web Speech API interfaces
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

export function useVoiceAssistant(settings: AppSettings) {
  const [state, setState] = useState<VoiceAssistantState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [transcriptDraft, setTranscriptDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);

  // References for audio context and stream
  const isSessionActiveRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const playbackAnalyserRef = useRef<AnalyserNode | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const accumulatedSpeechRef = useRef<string>('');
  const activeAnalyserRef = useRef<AnalyserNode | null>(null);
  const [activeAnalyser, setActiveAnalyser] = useState<AnalyserNode | null>(null);

  // Fetch backend status and voices on load
  const loadStatusAndVoices = useCallback(async () => {
    try {
      const statusRes = await fetch('/api/status', {
        headers: settings.customApiKey
          ? { 'x-elevenlabs-api-key': settings.customApiKey }
          : undefined,
      });
      if (statusRes.ok) {
        const statusData: BackendStatus = await statusRes.json();
        setBackendStatus(statusData);
      }
    } catch (e) {
      console.warn('Failed to load backend status:', e);
    }

    try {
      const voicesRes = await fetch('/api/elevenlabs/voices', {
        headers: settings.customApiKey
          ? { 'x-elevenlabs-api-key': settings.customApiKey }
          : undefined,
      });
      if (voicesRes.ok) {
        const voicesData = await voicesRes.json();
        if (voicesData.voices && Array.isArray(voicesData.voices)) {
          setVoices(voicesData.voices);
        }
      }
    } catch (e) {
      console.warn('Failed to load voices:', e);
    }
  }, [settings.customApiKey]);

  useEffect(() => {
    loadStatusAndVoices();
  }, [loadStatusAndVoices]);

  // Helper to ensure AudioContext
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  // Stop currently playing audio immediately
  const stopAudioPlayback = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setPlayingMessageId(null);
  }, []);

  // Interruption handler
  const handleInterrupt = useCallback(() => {
    stopAudioPlayback();
    setState('interrupted');
    setTimeout(() => {
      if (isSessionActiveRef.current) {
        startListening();
      } else {
        setState('idle');
      }
    }, 200);
  }, [stopAudioPlayback]);

  // Send message to AI and synthesize response
  const processUserMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Stop listening while processing
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setTranscriptDraft('');
      accumulatedSpeechRef.current = '';

      // Add user message to transcript
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setState('processing');
      setErrorMessage(null);

      try {
        // 1. Call /api/chat with conversation history
        const chatHistory = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.text,
        }));

        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: text.trim(),
            history: chatHistory,
            persona: settings.persona,
          }),
        });

        if (!chatRes.ok) {
          const errData = await chatRes.json().catch(() => ({}));
          throw new Error(errData.error || `AI Chat error (${chatRes.status})`);
        }

        const { reply } = await chatRes.json();

        // 2. Synthesize speech via /api/elevenlabs/tts
        const ttsHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (settings.customApiKey) {
          ttsHeaders['x-elevenlabs-api-key'] = settings.customApiKey;
        }

        const ttsRes = await fetch('/api/elevenlabs/tts', {
          method: 'POST',
          headers: ttsHeaders,
          body: JSON.stringify({
            text: reply,
            voiceId: settings.voiceId,
            modelId: settings.modelId,
            voiceSettings: settings.voiceSettings,
          }),
        });

        let audioUrl: string | undefined;
        let engineType: 'elevenlabs' | 'gemini-fallback' = 'elevenlabs';

        if (ttsRes.ok) {
          const engineHeader = ttsRes.headers.get('x-voxa-engine');
          if (engineHeader === 'gemini-tts-fallback') {
            engineType = 'gemini-fallback';
          }
          const audioBlob = await ttsRes.blob();
          audioUrl = URL.createObjectURL(audioBlob);
        } else {
          console.warn('TTS request error, proceeding without audio');
        }

        const assistantMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: reply,
          timestamp: new Date(),
          audioBlobUrl: audioUrl,
          engine: engineType,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // 3. Play audio response if available
        if (audioUrl && isSessionActiveRef.current) {
          playAssistantAudio(assistantMessage);
        } else {
          // If no audio or session stopped, resume listening or idle
          if (isSessionActiveRef.current && settings.autoListen) {
            startListening();
          } else {
            setState('idle');
          }
        }
      } catch (err: unknown) {
        console.error('Error processing user message:', err);
        const msg = err instanceof Error ? err.message : 'Failed to process message';
        setErrorMessage(msg);
        setState('error');
        if (isSessionActiveRef.current && settings.autoListen) {
          setTimeout(startListening, 3000);
        }
      }
    },
    [messages, settings]
  );

  // Play audio response with AnalyserNode for audio-reactive visualizer
  const playAssistantAudio = useCallback(
    (message: Message) => {
      if (!message.audioBlobUrl) return;

      stopAudioPlayback();
      setState('speaking');
      setPlayingMessageId(message.id);

      const audio = new Audio(message.audioBlobUrl);
      currentAudioRef.current = audio;

      const ctx = getAudioContext();
      if (!playbackAnalyserRef.current) {
        playbackAnalyserRef.current = ctx.createAnalyser();
        playbackAnalyserRef.current.fftSize = 256;
      }

      // Connect audio element to Web Audio analyzer
      try {
        const source = ctx.createMediaElementSource(audio);
        source.connect(playbackAnalyserRef.current);
        playbackAnalyserRef.current.connect(ctx.destination);
      } catch {
        // createMediaElementSource can only be called once per element
      }

      activeAnalyserRef.current = playbackAnalyserRef.current;
      setActiveAnalyser(playbackAnalyserRef.current);

      audio.onended = () => {
        setPlayingMessageId(null);
        currentAudioRef.current = null;

        // Auto-reopen listening after AI finishes speaking
        if (isSessionActiveRef.current && settings.autoListen) {
          startListening();
        } else {
          setState('idle');
        }
      };

      audio.onerror = () => {
        setPlayingMessageId(null);
        currentAudioRef.current = null;
        if (isSessionActiveRef.current && settings.autoListen) {
          startListening();
        } else {
          setState('idle');
        }
      };

      audio.play().catch((playErr) => {
        console.warn('Playback error (browser policy):', playErr);
        if (isSessionActiveRef.current && settings.autoListen) {
          startListening();
        } else {
          setState('idle');
        }
      });
    },
    [settings.autoListen, stopAudioPlayback]
  );

  // Replay a previous message
  const replayMessageAudio = useCallback(
    (message: Message) => {
      if (!message.audioBlobUrl) return;
      playAssistantAudio(message);
    },
    [playAssistantAudio]
  );

  // Start microphone and speech recognition
  const startListening = useCallback(async () => {
    if (isMuted) return;

    try {
      const ctx = getAudioContext();

      // Ensure microphone stream
      if (!micStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        micStreamRef.current = stream;

        const micSource = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        micSource.connect(analyser);
        micAnalyserRef.current = analyser;
      }

      activeAnalyserRef.current = micAnalyserRef.current;
      setActiveAnalyser(micAnalyserRef.current);

      setState('listening');
      setTranscriptDraft('');
      accumulatedSpeechRef.current = '';

      // Set up Web Speech recognition
      const SpeechRecognitionClass =
        (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {
            // ignore
          }
        }

        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let currentInterim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              currentFinal += transcript + ' ';
            } else {
              currentInterim += transcript;
            }
          }

          if (currentFinal) {
            accumulatedSpeechRef.current += currentFinal;
          }

          const combined = (accumulatedSpeechRef.current + currentInterim).trim();
          setTranscriptDraft(combined);

          // If assistant is speaking and user starts speaking, trigger interruption
          if (state === 'speaking' && settings.enableInterruption && combined.length > 2) {
            handleInterrupt();
            return;
          }

          // Reset silence timer whenever speech is detected
          if (silenceTimerRef.current) {
            window.clearTimeout(silenceTimerRef.current);
          }

          if (combined.length > 0) {
            silenceTimerRef.current = window.setTimeout(() => {
              const textToSend = (accumulatedSpeechRef.current + currentInterim).trim();
              if (textToSend) {
                processUserMessage(textToSend);
              }
            }, settings.silenceThresholdSeconds * 1000);
          }
        };

        recognition.onerror = (e: SpeechRecognitionErrorEventLike) => {
          console.warn('Speech recognition status/error:', e.error);
          if (e.error === 'not-allowed') {
            setErrorMessage('Microphone access was denied. Please allow microphone in browser permissions.');
            setState('error');
          }
        };

        recognition.onend = () => {
          // Auto-restart recognition if still in listening state and session active
          if (isSessionActiveRef.current && state === 'listening' && !isMuted) {
            try {
              recognition.start();
            } catch {
              // ignore
            }
          }
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch {
          // already started
        }
      } else {
        setErrorMessage('Browser speech recognition is not supported in this browser. You can type messages below.');
      }
    } catch (err: unknown) {
      console.error('Failed to access microphone:', err);
      const msg = err instanceof Error ? err.message : 'Microphone error';
      setErrorMessage(`Microphone access error: ${msg}. Please ensure microphone permissions are granted.`);
      setState('error');
    }
  }, [
    isMuted,
    processUserMessage,
    settings.silenceThresholdSeconds,
    settings.enableInterruption,
    state,
    handleInterrupt,
  ]);

  // Start the entire continuous voice conversation session
  const startConversation = useCallback(async () => {
    isSessionActiveRef.current = true;
    setErrorMessage(null);
    await startListening();
  }, [startListening]);

  // End conversation session
  const endConversation = useCallback(() => {
    isSessionActiveRef.current = false;
    stopAudioPlayback();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    setTranscriptDraft('');
    setState('idle');
  }, [stopAudioPlayback]);

  // Toggle conversation session
  const toggleConversation = useCallback(() => {
    if (isSessionActiveRef.current) {
      endConversation();
    } else {
      startConversation();
    }
  }, [startConversation, endConversation]);

  // Toggle microphone mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      if (next && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      } else if (!next && isSessionActiveRef.current && state === 'listening') {
        try {
          recognitionRef.current?.start();
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, [state]);

  // Clear messages history
  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        window.clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
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
    refreshStatus: loadStatusAndVoices,
  };
}
