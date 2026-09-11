import { NextResponse } from 'next/server';
import { fetchGitHubAnalysis } from '@/lib/services/github-service';
import { friendlyAIErrorMessage } from '@/lib/ai/error';
import { validateGitHubUrlInput } from '@/lib/validation/schemas';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = validateGitHubUrlInput(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error, field: validation.field }, { status: 400 });
    }

    const analysis = await fetchGitHubAnalysis(validation.data);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('GitHub analysis failed:', error);
    return NextResponse.json({ error: friendlyAIErrorMessage(error) }, { status: 502 });
  }
}
