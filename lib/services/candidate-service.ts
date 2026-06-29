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

export async function updateTestResultByEmail(
  email: string,
  testLa: number | null,
  testCode: number | null
) {
  const update: Record<string, number | null> = {};
  if (testLa !== null) update.test_la = testLa;
  if (testCode !== null) update.test_code = testCode;

  if (Object.keys(update).length === 0) {
    return { matched: 0 };
  }

  const { data, error } = await supabase
    .from("candidates")
    .update(update)
    .ilike("email", email)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  return { matched: data?.length ?? 0 };
}