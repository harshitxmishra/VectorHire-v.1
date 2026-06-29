import { NextResponse } from 'next/server';
import { fetchGitHubAnalysis } from '@/lib/services/github-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = typeof body?.github === 'string' ? body.github.trim() : '';

    if (!url) {
      return NextResponse.json({ error: 'github URL is required.' }, { status: 400 });
    }

    const analysis = await fetchGitHubAnalysis(url);
    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub analysis failed.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
