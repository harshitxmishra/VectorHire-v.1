import { NextResponse } from 'next/server';
import { getOrAnalyzeGitHub } from '@/lib/services/github-service';
import { logTimelineEvent } from '@/lib/services/timeline-service';
import { friendlyAIErrorMessage } from '@/lib/ai/error';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const candidateId = Number(body?.candidate_id);

    if (!Number.isFinite(candidateId)) {
      return NextResponse.json({ error: 'candidate_id is required.' }, { status: 400 });
    }

    const analysis = await getOrAnalyzeGitHub(candidateId);
    await logTimelineEvent(candidateId, 'github_analyzed', `Score: ${analysis.score}`);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('GitHub analysis failed:', error);
    return NextResponse.json({ error: friendlyAIErrorMessage(error) }, { status: 502 });
  }
}
