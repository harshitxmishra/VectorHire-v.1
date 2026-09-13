import { NextResponse } from "next/server";
import { getCandidates, getCandidatesPaginated } from "@/lib/services/candidate-service";
import { deleteAllCandidates } from "@/lib/services/dataset-service";
import { verifyServerAuth, requireDestructiveConfirmation } from "@/lib/auth/server-auth";
import { CandidateSortField, CandidateSortOrder } from "@/lib/repositories/candidate-repository";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const college = url.searchParams.get("college") || undefined;
  const minScoreStr = url.searchParams.get("minScore");
  const maxScoreStr = url.searchParams.get("maxScore");
  const sortByStr = url.searchParams.get("sortBy") as CandidateSortField | null;
  const sortOrderStr = url.searchParams.get("sortOrder") as CandidateSortOrder | null;
  const pageStr = url.searchParams.get("page");
  const limitStr = url.searchParams.get("limit");

  const isPaginatedQuery =
    url.searchParams.has("page") ||
    url.searchParams.has("limit") ||
    url.searchParams.has("search") ||
    url.searchParams.has("status") ||
    url.searchParams.has("college") ||
    url.searchParams.has("minScore") ||
    url.searchParams.has("maxScore") ||
    url.searchParams.has("sortBy");

  try {
    if (isPaginatedQuery) {
      const filters = {
        search,
        status: status && status !== "all" ? status : undefined,
        college: college && college !== "all" ? college : undefined,
        minScore: minScoreStr ? Number(minScoreStr) : undefined,
        maxScore: maxScoreStr ? Number(maxScoreStr) : undefined,
        sortBy: sortByStr || undefined,
        sortOrder: sortOrderStr || undefined,
        page: pageStr ? Math.max(1, Number(pageStr)) : 1,
        limit: limitStr ? Math.min(100, Math.max(1, Number(limitStr))) : 20,
      };

      const result = await getCandidatesPaginated(filters);
      return NextResponse.json(result);
    }

    const data = await getCandidates();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch candidates.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  // 1. Verify caller authentication/authorization
  const auth = await verifyServerAuth(req);
  if (!auth.authorized) {
    return auth.response ?? NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  // 2. Defense-in-depth confirmation header against accidental destructive requests
  const confirm = requireDestructiveConfirmation(req);
  if (!confirm.confirmed) {
    return confirm.response ?? NextResponse.json({ error: "Confirmation required." }, { status: 400 });
  }

  try {
    await deleteAllCandidates();
    return NextResponse.json({ success: true, message: "All candidate records purged successfully." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete candidates.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}