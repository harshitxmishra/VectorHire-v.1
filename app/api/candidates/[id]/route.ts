import { NextResponse } from 'next/server';
import {
  getCandidateById,
  updateCandidateStatus,
  deleteCandidate,
} from '@/lib/services/candidate-service';
import { validateCandidateStatus } from '@/lib/validation/schemas';
import { verifyServerAuth } from '@/lib/auth/server-auth';

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
    return NextResponse.json(candidate);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch candidate.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidateId = Number(id);

  if (!Number.isFinite(candidateId) || candidateId <= 0) {
    return NextResponse.json({ error: 'Invalid candidate id. Must be a positive integer.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const validation = validateCandidateStatus(body?.status);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error, field: validation.field }, { status: 400 });
    }

    const data = await updateCandidateStatus(candidateId, validation.data);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update candidate.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyServerAuth(req);
  if (!auth.authorized) {
    return auth.response ?? NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { id } = await params;
  const candidateId = Number(id);

  if (!Number.isFinite(candidateId) || candidateId <= 0) {
    return NextResponse.json({ error: 'Invalid candidate id. Must be a positive integer.' }, { status: 400 });
  }

  try {
    await deleteCandidate(candidateId);
    return NextResponse.json({ success: true, message: `Candidate ${candidateId} deleted.` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete candidate.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
