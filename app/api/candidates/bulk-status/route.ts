import { NextResponse } from 'next/server';
import { bulkUpdateCandidateStatus } from '@/lib/services/candidate-service';
import { validateCandidateStatus } from '@/lib/validation/schemas';
import { verifyServerAuth } from '@/lib/auth/server-auth';

export async function PATCH(req: Request) {
  const auth = await verifyServerAuth(req);
  if (!auth.authorized) {
    return auth.response ?? NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { candidateIds, status } = body ?? {};

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json(
        { error: 'candidateIds must be a non-empty array of candidate IDs.' },
        { status: 400 }
      );
    }

    if (candidateIds.length > 100) {
      return NextResponse.json(
        { error: 'Cannot update more than 100 candidates in a single bulk request.' },
        { status: 400 }
      );
    }

    const validIds = candidateIds.filter((id) => Number.isFinite(id) && id > 0);
    if (validIds.length !== candidateIds.length) {
      return NextResponse.json(
        { error: 'All candidateIds must be positive integers.' },
        { status: 400 }
      );
    }

    const statusValidation = validateCandidateStatus(status);
    if (!statusValidation.success) {
      return NextResponse.json(
        { error: statusValidation.error, field: statusValidation.field },
        { status: 400 }
      );
    }

    const result = await bulkUpdateCandidateStatus(validIds, statusValidation.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to bulk update candidate status.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
