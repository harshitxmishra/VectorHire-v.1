import { NextResponse } from "next/server";
import { verifyServerAuth } from "@/lib/auth/server-auth";

export async function GET(
  req: Request,
  props: { params: Promise<{ jobId: string }> }
) {
  const auth = await verifyServerAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  const { jobId } = await props.params;

  // In Next.js direct serverless mode, imports execute synchronously and return immediately.
  // This endpoint provides compatibility for any queued/polling worker clients.
  return NextResponse.json({
    jobId,
    state: "completed",
    progress: 100,
    result: {
      success: true,
    },
  });
}
