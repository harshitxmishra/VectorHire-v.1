import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { parseResumeForCandidate } from "@/lib/services/resume-service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidateId = Number(id);

  if (!Number.isFinite(candidateId)) {
    return NextResponse.json({ error: "Invalid candidate id." }, { status: 400 });
  }

  const { data: candidate, error } = await supabase
    .from("candidates")
    .select("id, resume_url")
    .eq("id", candidateId)
    .single();

  if (error || !candidate) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  if (!candidate.resume_url) {
    return NextResponse.json({ error: "Candidate has no resume URL." }, { status: 400 });
  }

  const result = await parseResumeForCandidate(candidate.id, candidate.resume_url);

  if (result.status === "failed") {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(result);
}
