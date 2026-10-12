# Voxa AI - Voice AI Conversational Assistant Using ElevenLabs

Voxa AI is a real-time, two-way conversational voice assistant powered by **ElevenLabs** speech synthesis and **Gemini 3.8 Flash** conversational intelligence. It provides a fluid, hands-free conversational experience with real Web Audio API-reactive visual waveforms, live speech-to-text, and natural interruption handling.

---

## Architecture Overview

```
 ┌────────────────┐          ┌───────────────────────┐          ┌───────────────────────────┐
 │   User Voice   │ ───────> │  Web Audio & Speech   │ ───────> │    Express Fullstack      │
 │   Microphone   │          │  Recognition (VAD)    │          │    Backend (/server.ts)   │
 └────────────────┘          └───────────────────────┘          └─────────────┬─────────────┘
                                                                              │
                                       ┌──────────────────────────────────────┴──────────────────────────────────────┐
                                       ▼                                                                             ▼
                        ┌──────────────────────────────┐                                              ┌──────────────────────────────┐
                        │   Conversational AI Turn     │                                              │      ElevenLabs Voice        │
                        │   Gemini 3.8 Flash (/api/chat)│                                              │      Text-to-Speech API      │
                        │   Context-aware, spoken-form │                                              │      (/api/elevenlabs/tts)   │
                        └──────────────┬───────────────┘                                              └──────────────┬───────────────┘
                                       │                                                                             │
                                       └──────────────────────────────┬──────────────────────────────────────────────┘
                                                                      ▼
                                                       ┌──────────────────────────────┐
                                                       │   Real-time Audio Playback   │
                                                       │   + Reactive Waveform Orb    │
                                                       │   + Continuous Auto-Listen   │
                                                       └──────────────────────────────┘
```

---

## 1. Core Workflow

1. **User interaction:** The user clicks **"Start Conversation"**.
2. **Microphone permission:** The browser requests microphone access with echo cancellation and auto-gain control.
3. **Voice Activity Detection (VAD):** The assistant continuously tracks microphone volume and streaming speech recognition, highlighting spoken words in real time.
4. **End of turn detection:** When the user pauses for the configured silence threshold (default 1.4s), the turn automatically completes.
5. **Contextual AI generation:** The recognized utterance is sent along with previous turns to `/api/chat` using Gemini Flash. The model is specifically instructed for spoken voice (concise, natural, warm, no markdown symbols or bullet points).
6. **ElevenLabs speech synthesis:** The response is sent to `/api/elevenlabs/tts` with the user's chosen voice (e.g. Rachel, Adam, Bella, Antoni) and voice parameter sliders (stability, similarity boost, style exaggeration).
7. **Audio playback & visualizer:** The audio response streams back and is decoded through a Web Audio `AnalyserNode`. The central orb and frequency rings oscillate to the assistant's voice.
8. **Interruption handling:** If the user speaks while the AI is talking or clicks **"Interrupt"**, audio playback halts instantly and the new utterance is processed.
9. **Automatic continuous listening:** When the AI finishes speaking, the assistant automatically re-arms the microphone for the user's next sentence without requiring any button clicks.

---

## 2. Technology Stack

- **Frontend:**
  - React 19 + TypeScript
  - Vite 8
  - Tailwind CSS 4
  - Web Audio API (`AudioContext`, `AnalyserNode`, `MediaStreamAudioSourceNode`)
  - Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`)
  - Lucide React icons
- **Backend:**
  - Node.js + Express
  - Vite middleware integration (`server.ts`)
  - Server-side `@google/genai` integration with `gemini-3.8-flash`
  - ElevenLabs Text-to-Speech (`/v1/text-to-speech`) and Voices API (`/v1/voices`)
  - Intelligent fallback voice engine so testing works out-of-the-box before key configuration

---

## 3. Environment Variables Configuration

Create or update your `.env` file (copied from `.env.example`):

```bash
# GEMINI_API_KEY: Server-side Gemini API key for conversational intelligence
GEMINI_API_KEY="your_gemini_api_key"

# ELEVENLABS_API_KEY: Your ElevenLabs API key for high-fidelity speech synthesis
ELEVENLABS_API_KEY="your_elevenlabs_api_key_here"

# ELEVENLABS_AGENT_ID: Optional agent identifier
ELEVENLABS_AGENT_ID="your_elevenlabs_agent_id_here"
```

### How to get an ElevenLabs API Key:
1. Sign up or log in at [elevenlabs.io](https://elevenlabs.io).
2. Click your profile avatar in the bottom-left and select **API Keys** (or go to `https://elevenlabs.io/app/settings/api-keys`).
3. Create an API key and paste it into `.env` or into the in-app **Settings** modal.
4. Use the in-app **"Test Key"** button in Settings to verify your quota and account tier immediately.

---

## 4. Backend API Endpoints

- `GET /api/status`: Returns current backend connection status, indicating whether ElevenLabs and Gemini are configured.
- `GET /api/elevenlabs/voices`: Retrieves voices from ElevenLabs API (or curated presets if offline/unconfigured).
- `POST /api/elevenlabs/test-key`: Tests ElevenLabs API key validity against subscription endpoint.
- `POST /api/elevenlabs/tts`: Synthesizes speech using ElevenLabs (supports voice ID, model, stability, and similarity settings).
- `POST /api/chat`: Multi-turn conversational endpoint optimized for spoken dialogue.
- `POST /api/stt`: Multimodal audio speech-to-text fallback endpoint.

---

## 5. Practical Verification & Testing Checklist

- [x] **Microphone permission handling:** Cleanly handles user grant and permission denial with user-friendly notices.
- [x] **Live speech recognition:** Captures spoken input with real-time subtitle preview before final submission.
- [x] **Context-aware multi-turn dialogue:** Remembers previous turns across the conversational session.
- [x] **ElevenLabs voice playback:** High-fidelity natural speech with voice previews in the settings panel.
- [x] **Interruption handling:** Speaking while the assistant is talking immediately cuts off playback and shifts to listening.
- [x] **Hands-free continuous conversation:** Auto-resumes listening after AI finishes speaking.
- [x] **Audio-reactive visualizer:** Responds dynamically to microphone input and audio playback volume using real Web Audio API frequency analysis.
- [x] **Transcript and audio replay:** Displays full conversation with timestamps, copy tools, and replay button.
- [x] **Text input fallback:** Allows keyboard typing with quick starter suggestions.
- [x] **Graceful degradation:** Provides high-fidelity fallback voice if ElevenLabs API key is not yet set.
