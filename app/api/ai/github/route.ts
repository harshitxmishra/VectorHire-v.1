import { NextResponse } from 'next/server';
import { getOrAnalyzeGitHub } from '@/lib/services/github-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const candidateId = Number(body?.candidate_id);

    if (!Number.isFinite(candidateId)) {
      return NextResponse.json({ error: 'candidate_id is required.' }, { status: 400 });
    }

    const analysis = await getOrAnalyzeGitHub(candidateId);
    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub analysis failed.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
