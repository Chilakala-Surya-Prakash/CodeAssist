import { GoogleGenAI, Type } from '@google/genai';

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error('GEMINI_API_KEY is not set. Add it to your Vercel Project Environment Variables.'),
      { status: 503 }
    );
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { code, language, customInput, problemTitle } = body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Code is required to generate a custom trace.' });
      return;
    }

    const ai = getGenAIClient();
    const candidateModels = [
      'gemini-flash-lite-latest',
      'gemini-flash-latest',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
    ];
    let response: any = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
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
        break;
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.code;
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

    if (!response) {
      throw lastError;
    }

    const rawSteps = JSON.parse((response.text ?? '[]').trim());
    res.status(200).json({ steps: rawSteps });
  } catch (error: any) {
    console.error('Vercel /api/tutor/trace error:', error?.message || error);
    const status = error?.status || 500;
    res.status(status).json({
      error:
        error?.message ||
        'Failed to generate custom Gemini trace. Verify GEMINI_API_KEY in your environment variables.',
    });
  }
}
