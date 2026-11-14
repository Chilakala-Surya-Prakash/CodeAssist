import { GoogleGenAI,  } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  MODELS,
  TRACE_RESPONSE_SCHEMA,
  buildTracePrompt,
  parseTraceBody,
  parseTraceSteps,
  sendTutorError,
} from '../../lib/tutor.js';

// NOTE: serverless instances don't share memory, so in-process rate limiting is ineffective here.
// Enable Vercel WAF rate limiting (or Upstash Ratelimit) on /api/tutor/* for production.

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error('GEMINI_API_KEY is not set.'), { status: 503 });
  }
  return new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
}

async function generateWithFallback(ai: GoogleGenAI, params: { contents: string; config?: Record<string, any> }) {
  let lastError: any = null;
  for (const model of MODELS) {
    try {
      return await ai.models.generateContent({ model, contents: params.contents, config: params.config });
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code;
      if (status === 503 || status === 429 || status === 404) continue;
      throw err;
    }
  }
  throw lastError;
}

function readBody(req: VercelRequest): unknown {
  try {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }
  try {
    const parsed = parseTraceBody(readBody(req));
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const response = await generateWithFallback(getGenAIClient(), {
      contents: buildTracePrompt(parsed.value),
      config: { responseMimeType: 'application/json', responseSchema: TRACE_RESPONSE_SCHEMA },
    });
    res.status(200).json({ steps: parseTraceSteps(response.text ?? '[]') });
  } catch (error: any) {
    sendTutorError(res, error, 'Vercel /api/tutor/trace');
  }
}
