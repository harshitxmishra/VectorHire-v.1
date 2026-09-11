import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { deleteAllCandidates } from "@/lib/services/dataset-service";
import { verifyServerAuth, requireDestructiveConfirmation } from "@/lib/auth/server-auth";

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

export async function DELETE(req: Request) {
  // 1. Verify caller authentication/authorization
  const auth = await verifyServerAuth(req);
  if (!auth.authorized) {
    return auth.response ?? NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // 2. Defense-in-depth confirmation header against accidental destructive requests
  const confirm = requireDestructiveConfirmation(req);
  if (!confirm.confirmed) {
    return confirm.response ?? NextResponse.json({ error: 'Confirmation required.' }, { status: 400 });
  }

  try {
    await deleteAllCandidates();
    return NextResponse.json({ success: true, message: 'All candidate records purged successfully.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete candidates.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}