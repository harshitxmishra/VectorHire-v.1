import { Candidate } from "@/lib/types";
import {
  CandidateRepository,
  CandidateFilters,
  PaginatedCandidates,
  CreateCandidateData,
} from "@/lib/repositories/candidate-repository";
import { SupabaseCandidateRepository } from "@/lib/repositories/supabase-candidate-repository";
import { logTimelineEvent } from "@/lib/services/timeline-service";

const defaultCandidateRepository: CandidateRepository = new SupabaseCandidateRepository();

export async function insertCandidates(
  candidates: CreateCandidateData[],
  repo: CandidateRepository = defaultCandidateRepository
): Promise<Candidate[]> {
  return repo.createMany(candidates);
}

export async function getCandidates(
  repo: CandidateRepository = defaultCandidateRepository
): Promise<Candidate[]> {
  return repo.findAll();
}

export async function getCandidatesPaginated(
  filters?: CandidateFilters,
  repo: CandidateRepository = defaultCandidateRepository
): Promise<PaginatedCandidates> {
  return repo.findPaginated(filters);
}

export const ASSESSMENT_PASS_THRESHOLD = 60;

export async function updateTestResultByEmail(
  email: string,
  testLa: number | null,
  testCode: number | null,
  repo: CandidateRepository = defaultCandidateRepository
): Promise<{ matchedIds: number[]; eligible: boolean; overallScore: number | null }> {
  const overallScore =
    testLa !== null && testCode !== null ? Math.round((testLa + testCode) / 2) : null;
  const eligible = overallScore !== null && overallScore >= ASSESSMENT_PASS_THRESHOLD;

  const patch: Record<string, number | string | null> = {
    status: eligible ? "Interview Eligible" : "Assessment Completed",
  };
  if (testLa !== null) patch.test_la = testLa;
  if (testCode !== null) patch.test_code = testCode;

  const matchedIds = await repo.updateByEmail(email, patch);
  return { matchedIds, eligible, overallScore };
}

export async function getCandidateById(
  id: number,
  repo: CandidateRepository = defaultCandidateRepository
): Promise<Candidate | null> {
  return repo.findById(id);
}

export async function updateCandidateStatus(
  id: number,
  status: string,
  repo: CandidateRepository = defaultCandidateRepository
): Promise<Candidate> {
  const existing = await repo.findById(id);
  const updated = await repo.updateStatus(id, status);

  // Log timeline event only if status actually changed
  if (!existing || existing.status?.toLowerCase() !== status.toLowerCase()) {
    try {
      await logTimelineEvent(id, "status_changed", `Moved to ${status}`);
    } catch (err) {
      console.error(`Failed to log timeline event for candidate ${id}:`, err);
    }
  }

  return updated;
}

export async function bulkUpdateCandidateStatus(
  ids: number[],
  status: string,
  repo: CandidateRepository = defaultCandidateRepository
): Promise<{ updated: number; candidates: Candidate[] }> {
  if (!ids || ids.length === 0) {
    return { updated: 0, candidates: [] };
  }

  // 1. Fetch existing candidates to compare statuses
  const existing = await repo.findByIds(ids);
  const statusChangedMap = new Map<number, boolean>();
  for (const c of existing) {
    statusChangedMap.set(c.id, c.status?.toLowerCase() !== status.toLowerCase());
  }

  // 2. Perform bulk update
  const updatedCandidates = await repo.updateStatusMany(ids, status);

  // 3. Conditionally log timeline events only for candidates whose status actually changed
  for (const candidate of updatedCandidates) {
    if (statusChangedMap.get(candidate.id)) {
      try {
        await logTimelineEvent(candidate.id, "status_changed", `Bulk updated to ${status}`);
      } catch (err) {
        console.error(`Failed to log timeline event for candidate ${candidate.id}:`, err);
      }
    }
  }

  return {
    updated: updatedCandidates.length,
    candidates: updatedCandidates,
  };
}

export async function deleteCandidate(
  id: number,
  repo: CandidateRepository = defaultCandidateRepository
): Promise<void> {
  return repo.delete(id);
}