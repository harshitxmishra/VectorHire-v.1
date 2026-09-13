import { NextResponse } from 'next/server';
import { getCandidateEmailLogs } from '@/lib/services/email-service';
import { getCandidateById } from '@/lib/services/candidate-service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidateId = Number(id);

  if (!Number.isFinite(candidateId) || candidateId <= 0) {
    return NextResponse.json({ error: 'Invalid candidate id. Must be a positive integer.' }, { status: 400 });
  }

  try {
    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: `Candidate with ID ${candidateId} not found.` }, { status: 404 });
    }

    const emailLogs = await getCandidateEmailLogs(candidateId);
    return NextResponse.json(emailLogs);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load email logs.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
