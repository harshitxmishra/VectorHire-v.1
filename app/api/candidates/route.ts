import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { deleteAllCandidates } from "@/lib/services/dataset-service";

export async function GET() {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("ai_score", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE() {
  try {
    await deleteAllCandidates();
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete candidates.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}