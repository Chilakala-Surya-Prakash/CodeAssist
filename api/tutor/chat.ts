import { GoogleGenAI } from '@google/genai';

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
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
    const { message, problemTitle, language, code, currentStep, history } = body;

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

    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
    ];
    let response: any = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              'You are the Principal Staff Algorithms & Systems Mentor on TraceCraft. Explain memory allocation (stack frames vs heap objects), pointer movements, loop invariants, and time/space complexity with crystalline precision. Keep responses concise (120-220 words), structured with short bullet points or inline code references, and reference the exact heap addresses, pointers, and line numbers from the active execution step.',
          },
        });
        break;
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.code;
        if (status === 503 || status === 429 || String(err?.message || '').includes('503')) {
          continue;
        }
        throw err;
      }
    }

    if (!response) {
      throw lastError;
    }

    res.status(200).json({
      reply: response.text || 'Unable to generate response.',
    });
  } catch (error: any) {
    console.error('Vercel /api/tutor/chat error:', error?.message || error);
    const status = error?.status || 500;
    res.status(status).json({
      error:
        error?.message ||
        'Failed to reach Gemini AI Tutor. Verify GEMINI_API_KEY in your environment variables.',
    });
  }
}
