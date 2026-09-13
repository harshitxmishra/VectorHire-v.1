import { NextResponse } from "next/server";
import { getJobMatchesForJD, getJobMatchesPaginated } from "@/lib/services/job-match-service";
import { JobMatchSortField, JobMatchSortOrder } from "@/lib/repositories/job-match-repository";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobDescriptionId = Number(searchParams.get("jobDescriptionId"));

  if (!Number.isFinite(jobDescriptionId) || jobDescriptionId <= 0) {
    return NextResponse.json({ error: "jobDescriptionId query param is required." }, { status: 400 });
  }

  const isPaginated =
    searchParams.has("page") ||
    searchParams.has("limit") ||
    searchParams.has("search") ||
    searchParams.has("minScore") ||
    searchParams.has("status") ||
    searchParams.has("college") ||
    searchParams.has("sortBy");

  try {
    if (isPaginated) {
      const search = searchParams.get("search") || undefined;
      const minScore = searchParams.has("minScore") ? Number(searchParams.get("minScore")) : undefined;
      const status = searchParams.get("status") || undefined;
      const college = searchParams.get("college") || undefined;
      const sortBy = (searchParams.get("sortBy") as JobMatchSortField) || undefined;
      const sortOrder = (searchParams.get("sortOrder") as JobMatchSortOrder) || undefined;
      const page = searchParams.has("page") ? Number(searchParams.get("page")) : 1;
      const limit = searchParams.has("limit") ? Number(searchParams.get("limit")) : 25;

      const paginated = await getJobMatchesPaginated(jobDescriptionId, {
        search,
        minScore,
        status,
        college,
        sortBy,
        sortOrder,
        page,
        limit,
      });
      return NextResponse.json(paginated);
    }

    const matches = await getJobMatchesForJD(jobDescriptionId);
    return NextResponse.json(matches);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load job matches.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
