import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

type CandidateEvaluationInput = {
  full_name: string;
  college: string;
  cgpa: number;
  github: string;
  status: string;
  ai_score: number;
};

type CandidateEvaluationResult = {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  interviewQuestions: string[];
};

const systemPrompt =
  `You are a senior technical recruiter evaluating software engineering candidates.

Evaluate the candidate objectively.

Score the candidate from 0-100.

Return ONLY valid JSON.

Do not return markdown.

Do not include explanations outside JSON.`;

const evaluationSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      minimum: 0,
      maximum: 100,
    },
    summary: {
      type: Type.STRING,
    },
    strengths: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },
    weaknesses: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },
    recommendation: {
      type: Type.STRING,
    },
    interviewQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },
  },
  required: [
    'score',
    'summary',
    'strengths',
    'weaknesses',
    'recommendation',
    'interviewQuestions',
  ],
  propertyOrdering: [
    'score',
    'summary',
    'strengths',
    'weaknesses',
    'recommendation',
    'interviewQuestions',
  ],
} as const;

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function isValidCandidateInput(body: unknown): body is CandidateEvaluationInput {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const candidate = body as Record<string, unknown>;

  return (
    typeof candidate.full_name === 'string' &&
    typeof candidate.college === 'string' &&
    typeof candidate.cgpa === 'number' &&
    Number.isFinite(candidate.cgpa) &&
    typeof candidate.github === 'string' &&
    typeof candidate.status === 'string' &&
    typeof candidate.ai_score === 'number' &&
    Number.isFinite(candidate.ai_score)
  );
}

function isValidEvaluationResult(
  value: unknown
): value is CandidateEvaluationResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    typeof result.score === 'number' &&
    Number.isFinite(result.score) &&
    typeof result.summary === 'string' &&
    typeof result.recommendation === 'string' &&
    Array.isArray(result.strengths) &&
    result.strengths.every((item) => typeof item === 'string') &&
    Array.isArray(result.weaknesses) &&
    result.weaknesses.every((item) => typeof item === 'string') &&
    Array.isArray(result.interviewQuestions) &&
    result.interviewQuestions.every((item) => typeof item === 'string')
  );
}

function extractGeminiText(response: unknown): string {
  if (!response || typeof response !== 'object') {
    throw new Error('Gemini returned an invalid response object.');
  }

  const responseRecord = response as {
    text?: string;
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  if (typeof responseRecord.text === 'string' && responseRecord.text.trim()) {
    return responseRecord.text.trim();
  }

  const parts = responseRecord.candidates?.[0]?.content?.parts;

  if (!parts?.length) {
    throw new Error('Gemini returned no text content.');
  }

  const text = parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned empty text content.');
  }

  return text;
}

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured.' },
        { status: 500 }
      );
    }

    const body = (await req.json()) as unknown;

    if (!isValidCandidateInput(body)) {
      return NextResponse.json(
        { error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}

Return exactly this JSON structure:
{
  "score": number,
  "summary": string,
  "strengths": string[],
  "weaknesses": string[],
  "recommendation": string,
  "interviewQuestions": string[]
}

Candidate:
${JSON.stringify(body)}`
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: evaluationSchema,
      },
    });

    const content = extractGeminiText(response);
    const parsed = JSON.parse(content) as unknown;

    if (!isValidEvaluationResult(parsed)) {
      throw new Error('Gemini returned an invalid evaluation payload.');
    }

    return NextResponse.json(parsed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to evaluate candidate.';

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
