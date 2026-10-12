import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Shared Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Curated high quality ElevenLabs voice presets
const DEFAULT_ELEVENLABS_VOICES = [
  {
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    category: 'premade',
    description: 'Calm, clear, natural, warm, and articulate',
    labels: { accent: 'American', gender: 'female', age: 'young', use_case: 'conversational' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/df6788f9-5c96-470d-8312-aab513d806c5.mp3',
  },
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    category: 'premade',
    description: 'Deep, warm, confident, and professional',
    labels: { accent: 'American', gender: 'male', age: 'middle aged', use_case: 'narration' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/6734d75e-5fd8-45ee-9043-73aa8213e8fa.mp3',
  },
  {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    category: 'premade',
    description: 'Bright, sweet, friendly, expressive tone',
    labels: { accent: 'American', gender: 'female', age: 'young', use_case: 'conversational' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/0152fdf5-94f2-4954-81f3-5047cd217937.mp3',
  },
  {
    voice_id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    category: 'premade',
    description: 'Casual, friendly young American voice',
    labels: { accent: 'American', gender: 'male', age: 'young', use_case: 'conversational' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/TxGEqnHWrfWFTfGW9XjX/3a144e67-020e-4f23-8d63-55b4da48618a.mp3',
  },
  {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    category: 'premade',
    description: 'Well-rounded, engaging, and pleasant storytelling',
    labels: { accent: 'American', gender: 'male', age: 'young', use_case: 'conversational' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/38d8f870-0a30-4dd3-a136-e401561fbd9d.mp3',
  },
  {
    voice_id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    category: 'premade',
    description: 'Energetic, engaging, and modern conversational',
    labels: { accent: 'American', gender: 'female', age: 'young', use_case: 'social' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/508e64d0-a744-4231-ba2c-3522f6d0a790.mp3',
  },
  {
    voice_id: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold',
    category: 'premade',
    description: 'Crisp, authoritative, clear baritone voice',
    labels: { accent: 'American', gender: 'male', age: 'middle aged', use_case: 'assistant' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/VR6AewLTigWG4xSOukaG/9c249a5b-59b3-4680-bc0f-1557bf807bb1.mp3',
  },
  {
    voice_id: 'LcfcDJNigL55mhhHgEvD',
    name: 'Emily',
    category: 'premade',
    description: 'Gentle, empathetic, soothing voice',
    labels: { accent: 'American', gender: 'female', age: 'young', use_case: 'meditation' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/LcfcDJNigL55mhhHgEvD/3a6963e6-da64-42f1-9c60-a8eb0ba00a30.mp3',
  },
];

// Helper to resolve ElevenLabs API Key from header or env
function getElevenLabsApiKey(req: Request): string | undefined {
  const customKey = req.headers['x-elevenlabs-api-key'];
  if (typeof customKey === 'string' && customKey.trim().length > 0) {
    return customKey.trim();
  }
  return process.env.ELEVENLABS_API_KEY?.trim() || undefined;
}

// 1. Status endpoint
app.get('/api/status', (req: Request, res: Response) => {
  const apiKey = getElevenLabsApiKey(req);
  res.json({
    status: 'ok',
    elevenlabsConfigured: Boolean(apiKey && apiKey !== 'your_elevenlabs_api_key_here'),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    hasAgentId: Boolean(process.env.ELEVENLABS_AGENT_ID && process.env.ELEVENLABS_AGENT_ID !== 'your_elevenlabs_agent_id_here'),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 2. Test ElevenLabs key endpoint
app.post('/api/elevenlabs/test-key', async (req: Request, res: Response) => {
  try {
    const keyToTest = req.body.apiKey || getElevenLabsApiKey(req);
    if (!keyToTest) {
      return res.status(400).json({ valid: false, error: 'No ElevenLabs API key provided.' });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: {
        'xi-api-key': keyToTest,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        valid: false,
        error: `ElevenLabs authentication failed (${response.status}): ${errText}`,
      });
    }

    const data = (await response.json()) as Record<string, unknown>;
    return res.json({
      valid: true,
      subscription: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error testing ElevenLabs key';
    return res.status(500).json({ valid: false, error: message });
  }
});

// 3. Get voices
app.get('/api/elevenlabs/voices', async (req: Request, res: Response) => {
  const apiKey = getElevenLabsApiKey(req);

  if (apiKey && apiKey !== 'your_elevenlabs_api_key_here') {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': apiKey },
      });

      if (response.ok) {
        const data = (await response.json()) as { voices?: unknown[] };
        if (data.voices && Array.isArray(data.voices) && data.voices.length > 0) {
          return res.json({
            source: 'elevenlabs_api',
            voices: data.voices,
          });
        }
      }
    } catch (error) {
      console.warn('Failed to fetch voices from ElevenLabs API, falling back to curated presets:', error);
    }
  }

  // Return curated fallback list
  return res.json({
    source: 'curated_presets',
    voices: DEFAULT_ELEVENLABS_VOICES,
  });
});

// 4. Conversational Chat endpoint (Gemini Flash optimized for natural spoken dialogue)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [], persona = 'friendly', userTone = 'normal' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const ai = getGeminiClient();

    let personaInstruction = 'You are Voxa AI, a natural, empathetic, and ultra-responsive voice conversational assistant.';
    if (persona === 'professional') {
      personaInstruction += ' You are articulate, polished, highly efficient, and maintain a respectful executive demeanor.';
    } else if (persona === 'concise') {
      personaInstruction += ' Keep your responses ultra-brief, crisp, and direct (1-2 sentences maximum). Cut all filler.';
    } else if (persona === 'creative') {
      personaInstruction += ' You are witty, lively, imaginative, and speak with warm color and vivid curiosity.';
    } else if (persona === 'tutor') {
      personaInstruction += ' You are an encouraging mentor who explains concepts clearly, intuitively, and asks engaging check-in questions.';
    } else {
      personaInstruction += ' You are friendly, personable, helpful, and natural.';
    }

    const systemInstruction = `${personaInstruction}

CRITICAL RULES FOR SPOKEN VOICE RESPONSES:
1. Speak naturally as if in a real-time voice call. Keep answers concise (1-3 sentences per turn) so the user can easily listen and respond.
2. DO NOT use markdown formatting (no asterisks **, no hash tags #, no bullet lists -, no tables, no numbered lists 1., no brackets). Spoken voice synthesis will read these clumsily.
3. Spell out or write numbers and acronyms in phonetically friendly ways when appropriate.
4. Never say "As an AI language model". Speak with genuine presence, confidence, and warmth.
5. If the user asks a question, answer directly first, then follow up if helpful.
6. Support fluid interruptions: give the core answer upfront.`;

    // Construct multi-turn contents
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Include last 8 turns of context
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-8);
      for (const turn of recentHistory) {
        if (turn.role === 'user' && turn.content) {
          contents.push({ role: 'user', parts: [{ text: turn.content }] });
        } else if ((turn.role === 'assistant' || turn.role === 'model') && turn.content) {
          contents.push({ role: 'model', parts: [{ text: turn.content }] });
        }
      }
    }

    // Add current user prompt
    contents.push({ role: 'user', parts: [{ text: message }] });

    let reply = '';
    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: unknown = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        if (response.text) {
          reply = response.text.trim();
          break;
        }
      } catch (modelErr) {
        lastError = modelErr;
        console.warn(`Model ${modelName} call failed, trying next fallback:`, modelErr);
      }
    }

    if (!reply) {
      if (lastError) throw lastError;
      reply = 'I am here and listening. How can I assist you today?';
    }

    return res.json({ reply });
  } catch (err: unknown) {
    console.error('Error in /api/chat:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate chat response.';
    return res.status(500).json({ error: message });
  }
});

// 5. ElevenLabs Text-to-Speech generation endpoint
app.post('/api/elevenlabs/tts', async (req: Request, res: Response) => {
  try {
    const {
      text,
      voiceId = '21m00Tcm4TlvDq8ikWAM',
      modelId = 'eleven_turbo_v2_5',
      voiceSettings = {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true,
      },
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text to synthesize is required.' });
    }

    // Clean text of any accidental markdown symbols before speaking
    const cleanText = text
      .replace(/[*_#`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    const apiKey = getElevenLabsApiKey(req);

    // If ElevenLabs API key is present, invoke ElevenLabs TTS
    if (apiKey && apiKey !== 'your_elevenlabs_api_key_here') {
      const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

      const elevenResponse = await fetch(elevenUrl, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: modelId,
          voice_settings: {
            stability: Number(voiceSettings.stability ?? 0.5),
            similarity_boost: Number(voiceSettings.similarity_boost ?? 0.8),
            style: Number(voiceSettings.style ?? 0.0),
            use_speaker_boost: Boolean(voiceSettings.use_speaker_boost ?? true),
          },
        }),
      });

      if (!elevenResponse.ok) {
        const errBody = await elevenResponse.text();
        console.warn(`ElevenLabs TTS call failed (${elevenResponse.status}):`, errBody);
        // Fall back to server-side Gemini TTS if ElevenLabs errors out due to quota/credentials
        return await fallbackGeminiTts(cleanText, res, `ElevenLabs API error (${elevenResponse.status}): ${errBody}`);
      }

      const audioBuffer = await elevenResponse.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('x-voxa-engine', 'elevenlabs');
      return res.send(Buffer.from(audioBuffer));
    }

    // If ElevenLabs key is not configured yet, provide Gemini TTS fallback so the voice conversation immediately works!
    return await fallbackGeminiTts(cleanText, res, 'ElevenLabs API key not configured in environment or settings.');
  } catch (err: unknown) {
    console.error('Error in /api/elevenlabs/tts:', err);
    const message = err instanceof Error ? err.message : 'Voice synthesis failed.';
    return res.status(500).json({ error: message });
  }
});

// Helper for high-fidelity fallback speech synthesis using Gemini 3.8 Flash Lite TTS
async function fallbackGeminiTts(text: string, res: Response, noticeMessage: string) {
  try {
    const ai = getGeminiClient();
    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: 'Natural, friendly conversational speech',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const wavBuffer = Buffer.from(base64Audio, 'base64');
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('x-voxa-engine', 'gemini-tts-fallback');
      res.setHeader('x-voxa-notice', encodeURIComponent(noticeMessage));
      return res.send(wavBuffer);
    }
  } catch (geminiError) {
    console.warn('Fallback Gemini TTS failed:', geminiError);
  }

  // If even fallback fails, report structured error
  return res.status(400).json({
    error: noticeMessage || 'TTS generation unavailable. Please check your ElevenLabs API key.',
  });
}

// 6. Speech-to-Text endpoint (fallback when browser speech recognition is not available or for uploaded audio)
app.post('/api/stt', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Audio base64 data is required.' });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
          {
            text: 'Transcribe the spoken words in this audio accurately. Return ONLY the transcribed text with no extra commentary or punctuation labels.',
          },
        ],
      },
    });

    const transcript = response.text?.trim() || '';
    return res.json({ transcript });
  } catch (err: unknown) {
    console.error('Error in /api/stt:', err);
    const message = err instanceof Error ? err.message : 'Audio transcription failed.';
    return res.status(500).json({ error: message });
  }
});

// Setup Vite development middlewares or serve static build
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Voxa AI fullstack server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
