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