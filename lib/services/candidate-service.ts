import { Candidate } from "@/lib/types";
import { CandidateRepository, CreateCandidateData } from "@/lib/repositories/candidate-repository";
import { SupabaseCandidateRepository } from "@/lib/repositories/supabase-candidate-repository";

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
  return repo.updateStatus(id, status);
}

export async function deleteCandidate(
  id: number,
  repo: CandidateRepository = defaultCandidateRepository
): Promise<void> {
  return repo.delete(id);
}