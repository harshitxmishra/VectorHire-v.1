import { supabase } from "@/lib/supabase/client";
import { Candidate } from "@/lib/types";

export async function insertCandidates(candidates: any[]) {
  const { data, error } = await supabase
    .from("candidates")
    .insert(candidates)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("ai_score", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export const ASSESSMENT_PASS_THRESHOLD = 60;

export async function updateTestResultByEmail(
  email: string,
  testLa: number | null,
  testCode: number | null
): Promise<{ matchedIds: number[]; eligible: boolean; overallScore: number | null }> {
  const overallScore =
    testLa !== null && testCode !== null ? Math.round((testLa + testCode) / 2) : null;
  const eligible = overallScore !== null && overallScore >= ASSESSMENT_PASS_THRESHOLD;

  const update: Record<string, number | string | null> = {
    status: eligible ? "Interview Eligible" : "Assessment Completed",
  };
  if (testLa !== null) update.test_la = testLa;
  if (testCode !== null) update.test_code = testCode;

  const { data, error } = await supabase
    .from("candidates")
    .update(update)
    .ilike("email", email)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  return { matchedIds: (data ?? []).map((row) => row.id), eligible, overallScore };
}

export async function getCandidateById(id: number): Promise<Candidate | null> {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateCandidateStatus(
  id: number,
  status: string
): Promise<Candidate> {
  const { data, error } = await supabase
    .from('candidates')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteCandidate(id: number): Promise<void> {
  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}