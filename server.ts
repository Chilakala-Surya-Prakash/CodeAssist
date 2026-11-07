import 'dotenv/config';
import express from 'express';
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
  const candidateModels = [
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
  ];
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

  app.use(express.json({ limit: '1mb' }));

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
      const { message, problemTitle, language, code, currentStep, history } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required.' });
        return;
      }

      const ai = getGenAIClient();
      const stepSummary = currentStep
        ? `Current Execution Step #${currentStep.stepIndex + 1}: "${currentStep.title}"
Operation: ${currentStep.operationType}
Active Line (${language}): ${language === 'python' ? currentStep.pythonLine : currentStep.javaLine}
Intuition: ${currentStep.intuition}
Memory Mutation: ${currentStep.memoryMutation}
Invariant: ${currentStep.invariantCheck}
Stack Variables: ${JSON.stringify(currentStep.stackFrames?.[0]?.variables || [])}
Pointers: ${JSON.stringify(currentStep.pointers || [])}`
        : 'No step context provided.';

      const recentHistory = Array.isArray(history)
        ? history
            .slice(-6)
            .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n\n')
        : '';

      const prompt = `Context:
Problem: ${problemTitle || 'Algorithmic Problem'}
Active Language: ${language ? language.toUpperCase() : 'PYTHON'}
Current Code in Editor:
\`\`\`${language || 'python'}
${code || ''}
\`\`\`

Live Memory & Pointer State at Current Step:
${stepSummary}

${recentHistory ? `Recent Conversation:\n${recentHistory}\n\n` : ''}Student Question:
${message}`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction:
            'You are the Principal Staff Algorithms & Systems Mentor on TraceCraft. Explain memory allocation (stack frames vs heap objects), pointer movements, loop invariants, and time/space complexity with crystalline precision. Keep responses concise (120-220 words), structured with short bullet points or inline code references, and reference the exact heap addresses, pointers, and line numbers from the active execution step.',
        },
      });

      res.json({
        reply: response.text || 'Unable to generate response.',
      });
    } catch (error: any) {
      console.error('Gemini /api/tutor/chat error:', error?.message || error);
      const status = error?.status || 500;
      res.status(status).json({
        error:
          error?.message ||
          'Failed to reach Gemini AI Tutor. Check your GEMINI_API_KEY in Settings > Secrets.',
      });
    }
  });

  // 2. Dynamic Custom Code Memory & Pointer Trace Generator via Gemini Structured JSON
  app.post('/api/tutor/trace', async (req, res) => {
    try {
      const { code, language, customInput, problemTitle } = req.body;
      if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Code is required to generate a custom trace.' });
        return;
      }

      const ai = getGenAIClient();
      const response = await generateWithFallback(ai, {
        contents: `Trace the execution of the following ${language || 'Python'} code step-by-step on input "${customInput || 'default'}".
Problem: ${problemTitle || 'Custom Algorithm'}
Code:
${code}

Generate between 4 and 8 key execution steps showing how stack variables, heap objects (with realistic hex addresses like 0x1040, 0x1080), and pointers (like left, right, curr, prev, mid, slow, fast) evolve dynamically.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stepIndex: { type: Type.INTEGER },
                title: { type: Type.STRING },
                pythonLine: { type: Type.INTEGER },
                javaLine: { type: Type.INTEGER },
                operationType: { type: Type.STRING },
                intuition: { type: Type.STRING },
                memoryMutation: { type: Type.STRING },
                invariantCheck: { type: Type.STRING },
                stdout: { type: Type.STRING },
                stackVariables: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      value: { type: Type.STRING },
                      type: { type: Type.STRING },
                      address: { type: Type.STRING },
                      isPointer: { type: Type.BOOLEAN },
                    },
                  },
                },
                heapCells: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      index: { type: Type.STRING },
                      label: { type: Type.STRING },
                      value: { type: Type.STRING },
                      addressOffset: { type: Type.STRING },
                      nextAddress: { type: Type.STRING },
                      status: { type: Type.STRING },
                      annotation: { type: Type.STRING },
                    },
                  },
                },
                pointers: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      targetIndex: { type: Type.STRING },
                      targetAddress: { type: Type.STRING },
                      deltaDescription: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const rawSteps = JSON.parse((response.text ?? '[]').trim());
      res.json({ steps: rawSteps });
    } catch (error: any) {
      console.error('Gemini /api/tutor/trace error:', error?.message || error);
      const status = error?.status || 500;
      res.status(status).json({
        error:
          error?.message ||
          'Failed to generate custom Gemini trace. Check your GEMINI_API_KEY in Settings > Secrets.',
      });
    }
  });

  // 3. Gemini Live API WebSocket Bridge (/api/live) for Real-Time Voice Mode + Screen Sync
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '/', `http://${request.headers.host}`).pathname;
    if (pathname === '/api/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
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
            (initialContext || ''),
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
