import { GoogleGenAI } from '@google/genai';
import { toDirectDownloadUrl } from '@/lib/utils/google-drive';
import { supabase } from '@/lib/supabase/client';

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export interface ResumeFetchResult {
  base64: string;
  mimeType: string;
}

export async function fetchResumeFile(resumeUrl: string): Promise<ResumeFetchResult> {
  const directUrl = toDirectDownloadUrl(resumeUrl);
  const response = await fetch(directUrl, { redirect: 'follow' });

  if (!response.ok) {
    throw new Error(`Failed to download resume (HTTP ${response.status}).`);
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('text/html')) {
    throw new Error(
      'Drive returned a webpage instead of a file. Make sure the resume link is shared as "Anyone with the link can view".'
    );
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  return {
    base64,
    mimeType: contentType.includes('pdf') ? 'application/pdf' : 'application/pdf',
  };
}

export async function extractResumeText(resumeUrl: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const { base64, mimeType } = await fetchResumeFile(resumeUrl);

  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              'Extract all readable text content from this resume document. ' +
              'Return ONLY the extracted text, preserving the original structure with line breaks. ' +
              'Do not summarize, omit, or add any commentary.',
          },
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
        ],
      },
    ],
  });

  const text = response.text?.trim();

  if (!text) {
    throw new Error('Gemini returned no extracted text.');
  }

  return text;
}

export async function parseResumeForCandidate(candidateId: number, resumeUrl: string) {
  await supabase
    .from('candidates')
    .update({ parsing_status: 'pending' })
    .eq('id', candidateId);

  try {
    const resumeText = await extractResumeText(resumeUrl);

    const { error } = await supabase
      .from('candidates')
      .update({
        resume_text: resumeText,
        parsing_status: 'success',
        parsed_at: new Date().toISOString(),
      })
      .eq('id', candidateId);

    if (error) {
      throw new Error(error.message);
    }

    return { candidateId, status: 'success' as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Resume parsing failed.';

    await supabase
      .from('candidates')
      .update({
        parsing_status: 'failed',
        parsed_at: new Date().toISOString(),
      })
      .eq('id', candidateId);

    return { candidateId, status: 'failed' as const, error: message };
  }
}
