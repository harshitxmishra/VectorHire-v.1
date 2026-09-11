import { supabase } from '@/lib/supabase/client';
import { aiGenerateText } from '@/lib/ai/client';
import { safeFetchResumeBuffer } from '@/lib/utils/ssrf-protection';

export interface ResumeFetchResult {
  base64: string;
  mimeType: string;
}

export async function fetchResumeFile(resumeUrl: string): Promise<ResumeFetchResult> {
  const { buffer, contentType } = await safeFetchResumeBuffer(resumeUrl);
  const base64 = Buffer.from(buffer).toString('base64');

  return {
    base64,
    mimeType: contentType.includes('pdf') ? 'application/pdf' : 'application/pdf',
  };
}

export async function extractTextFromBase64(base64: string, mimeType: string): Promise<string> {
  return aiGenerateText({
    prompt:
      'Extract all readable text content from this resume document. ' +
      'Return ONLY the extracted text, preserving the original structure with line breaks. ' +
      'Do not summarize, omit, or add any commentary.',
    document: { mimeType, base64 },
  });
}

export async function extractResumeText(resumeUrl: string): Promise<string> {
  const { base64, mimeType } = await fetchResumeFile(resumeUrl);
  return extractTextFromBase64(base64, mimeType);
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
