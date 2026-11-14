import { GoogleGenAI,  } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  EXPLAIN_RESPONSE_SCHEMA,
  MODELS,
  buildExplainPrompt,
  explainCacheKey,
  getCachedExplain,
  parseExplainBody,
  parseExplainLines,
  sendTutorError,
  setCachedExplain,
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
    const parsed = parseExplainBody(readBody(req));
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const key = explainCacheKey(parsed.value);
    const cached = getCachedExplain(key);
    if (cached) {
      res.status(200).json({ lines: cached, cached: true });
      return;
    }
    const response = await generateWithFallback(getGenAIClient(), {
      contents: buildExplainPrompt(parsed.value),
      config: { responseMimeType: 'application/json', responseSchema: EXPLAIN_RESPONSE_SCHEMA },
    });
    const lines = parseExplainLines(response.text ?? '[]', parsed.value.code.split('\n').length);
    setCachedExplain(key, lines);
    res.status(200).json({ lines, cached: false });
  } catch (error: any) {
    sendTutorError(res, error, 'Vercel /api/tutor/explain');
  }
}
