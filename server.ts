import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import {
  FunctionDeclaration,
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Type,
} from '@google/genai';
import {
  CHAT_SYSTEM_INSTRUCTION,
  EXPLAIN_RESPONSE_SCHEMA,
  LIMITS,
  MODELS,
  TRACE_RESPONSE_SCHEMA,
  buildChatPrompt,
  buildExplainPrompt,
  buildTracePrompt,
  explainCacheKey,
  getCachedExplain,
  parseExplainBody,
  parseExplainLines,
  setCachedExplain,
  isAllowedOrigin,
  parseChatBody,
  parseTraceBody,
  parseTraceSteps,
  sendTutorError,
} from './lib/tutor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error('GEMINI_API_KEY is not set. Add it to your .env file or deployment secrets.'), { status: 503 });
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateWithFallback(
  ai: GoogleGenAI,
  params: { contents: string; config?: Record<string, any> }
) {
  const candidateModels = MODELS;
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      return await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code;
      // Retry on 503 Unavailable, 429 Rate Limit, or 404 (model deprecated/unsupported for account)
      if (
        status === 503 ||
        status === 429 ||
        status === 404 ||
        String(err?.message || '').includes('503') ||
        String(err?.message || '').includes('404')
      ) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

const syncVisualizerStepTool: FunctionDeclaration = {
  name: 'syncVisualizerStep',
  description:
    'Advances, rewinds, or jumps the on-screen code & memory visualizer to a specific execution step while explaining the algorithm in real-time voice mode.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: 'One of: "next", "prev", "reset", or "goto"',
      },
      stepIndex: {
        type: Type.INTEGER,
        description: 'Zero-based execution step index when action is "goto"',
      },
    },
    required: ['action'],
  },
};

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // Set TRUST_PROXY=1 behind one reverse proxy (Cloud Run, Render, nginx) so req.ip is the real client.
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || 0);
  app.use(express.json({ limit: '64kb' }));
  app.use(
    '/api/tutor',
    rateLimit({
      windowMs: 60_000,
      limit: Number(process.env.TUTOR_RATE_LIMIT) || 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests. Please slow down.' },
    })
  );

  // 0. Production Health Check Endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'tracecraft-api',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // 1. Real-time Personalized AI Tutor Endpoint (Text Chat)
  app.post('/api/tutor/chat', async (req, res) => {
    try {
      const parsed = parseChatBody(req.body);
      if ('error' in parsed) {
        res.status(400).json({ error: parsed.error });
        return;
      }
      const ai = getGenAIClient();
      const response = await generateWithFallback(ai, {
        contents: buildChatPrompt(parsed.value),
        config: { systemInstruction: CHAT_SYSTEM_INSTRUCTION },
      });
      res.json({ reply: response.text || 'Unable to generate response.' });
    } catch (error: any) {
      sendTutorError(res, error, 'Gemini /api/tutor/chat');
    }
  });

  // 2. Dynamic Custom Code Memory & Pointer Trace Generator via Gemini Structured JSON
  app.post('/api/tutor/trace', async (req, res) => {
    try {
      const parsed = parseTraceBody(req.body);
      if ('error' in parsed) {
        res.status(400).json({ error: parsed.error });
        return;
      }
      const ai = getGenAIClient();
      const response = await generateWithFallback(ai, {
        contents: buildTracePrompt(parsed.value),
        config: { responseMimeType: 'application/json', responseSchema: TRACE_RESPONSE_SCHEMA },
      });
      res.json({ steps: parseTraceSteps(response.text ?? '[]') });
    } catch (error: any) {
      sendTutorError(res, error, 'Gemini /api/tutor/trace');
    }
  });

  // 2b. Line-by-line code explanations (cached by code hash)
  app.post('/api/tutor/explain', async (req, res) => {
    try {
      const parsed = parseExplainBody(req.body);
      if ('error' in parsed) {
        res.status(400).json({ error: parsed.error });
        return;
      }
      const key = explainCacheKey(parsed.value);
      const cached = getCachedExplain(key);
      if (cached) {
        res.json({ lines: cached, cached: true });
        return;
      }
      const ai = getGenAIClient();
      const response = await generateWithFallback(ai, {
        contents: buildExplainPrompt(parsed.value),
        config: { responseMimeType: 'application/json', responseSchema: EXPLAIN_RESPONSE_SCHEMA },
      });
      const lines = parseExplainLines(response.text ?? '[]', parsed.value.code.split('\n').length);
      setCachedExplain(key, lines);
      res.json({ lines, cached: false });
    } catch (error: any) {
      sendTutorError(res, error, 'Gemini /api/tutor/explain');
    }
  });

  // 3. Gemini Live API WebSocket Bridge (/api/live) for Real-Time Voice Mode + Screen Sync
  const wss = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024 });
  const MAX_LIVE_TOTAL = Number(process.env.LIVE_MAX_CONNECTIONS) || 50;
  const MAX_LIVE_PER_IP = Number(process.env.LIVE_MAX_PER_IP) || 2;
  const liveByIp = new Map<string, number>();

  server.on('upgrade', (request, socket, head) => {
    const reject = (code: number, text: string) => {
      socket.write(`HTTP/1.1 ${code} ${text}\r\nConnection: close\r\n\r\n`);
      socket.destroy();
    };
    let pathname = '';
    try {
      pathname = new URL(request.url || '/', 'http://localhost').pathname;
    } catch {
      return reject(400, 'Bad Request');
    }
    if (pathname !== '/api/live') {
      // In dev, Vite's own upgrade handling is not affected (it runs on a separate HMR port).
      return reject(404, 'Not Found');
    }
    if (!isAllowedOrigin(request.headers.origin, request.headers.host, process.env.ALLOWED_ORIGINS)) {
      return reject(403, 'Forbidden');
    }
    const ip = request.socket.remoteAddress || 'unknown';
    if (wss.clients.size >= MAX_LIVE_TOTAL || (liveByIp.get(ip) || 0) >= MAX_LIVE_PER_IP) {
      return reject(429, 'Too Many Requests');
    }
    liveByIp.set(ip, (liveByIp.get(ip) || 0) + 1);
    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.on('close', () => {
        const n = (liveByIp.get(ip) || 1) - 1;
        if (n <= 0) liveByIp.delete(ip);
        else liveByIp.set(ip, n);
      });
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (clientWs: WebSocket) => {
    let sessionPromise: Promise<any> | null = null;

    const initLiveSession = (initialContext?: string) => {
      let ai: GoogleGenAI;
      try {
        ai = getGenAIClient();
      } catch (err: any) {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ error: err?.message || 'GEMINI_API_KEY is not configured.' }));
        }
        return;
      }
      sessionPromise = ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ functionDeclarations: [syncVisualizerStepTool] }],
          systemInstruction:
            'You are the Live Voice Algorithms Mentor on TraceCraft. You speak directly with the engineer while they watch the interactive Memory & Pointer Visualization on screen. Explain pointer changes, heap allocations, and stack frames naturally and concisely. You can call syncVisualizerStep(action="next" | "prev" | "goto", stepIndex) to step the visualization on their screen as you narrate each transition. ' +
            (typeof initialContext === 'string' ? initialContext.slice(0, LIMITS.liveContext) : ''),
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            const content = message.serverContent;
            if (content?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({ inputTranscript: content.inputTranscription.text })
              );
            }
            if (content?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({ outputTranscript: content.outputTranscription.text })
              );
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }

            // Forward visualization synchronization tool calls to the browser UI
            for (const call of message.toolCall?.functionCalls ?? []) {
              if (call.name === 'syncVisualizerStep') {
                clientWs.send(
                  JSON.stringify({
                    visualizerCommand: call.args,
                  })
                );
                sessionPromise?.then((s) =>
                  s.sendToolResponse({
                    functionResponses: [
                      {
                        id: call.id,
                        name: call.name,
                        response: { result: 'Visualizer step updated on screen' },
                      },
                    ],
                  })
                );
              }
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live session error:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  error: err?.message || 'Gemini Live API connection error.',
                })
              );
            }
          },
        },
      });

      sessionPromise
        .then(() => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ status: 'connected' }));
          }
        })
        .catch((err) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                error:
                  err?.message ||
                  'Failed to start Gemini Live Voice session. Verify GEMINI_API_KEY in Settings > Secrets.',
              })
            );
          }
        });
    };

    clientWs.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'init') {
          initLiveSession(msg.context);
          return;
        }
        if (!sessionPromise) {
          initLiveSession();
        }
        sessionPromise?.then((session) => {
          if (msg.audio) {
            session.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          }
          if (msg.text) {
            session.sendRealtimeInput({
              text: msg.text,
            });
          }
        });
      } catch (e) {
        console.error('Live WS message parse error:', e);
      }
    });

    clientWs.on('close', () => {
      sessionPromise?.then((session) => {
        try {
          session.close();
        } catch {
          // ignore
        }
      });
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.all('/api/*', (_req, res) => {
      res.status(404).json({ error: 'API route not found' });
    });
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`TraceCraft server running on http://localhost:${PORT}`);
  });
}

startServer();
