import { NextResponse } from "next/server";
import { getJobMatchesForJD } from "@/lib/services/job-match-service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobDescriptionId = Number(searchParams.get("jobDescriptionId"));

  if (!Number.isFinite(jobDescriptionId)) {
    return NextResponse.json({ error: "jobDescriptionId query param is required." }, { status: 400 });
  }

  try {
    const matches = await getJobMatchesForJD(jobDescriptionId);
    return NextResponse.json(matches);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load job matches.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
