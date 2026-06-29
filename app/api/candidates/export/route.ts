import { NextResponse } from "next/server";
import Papa from "papaparse";
import { getCandidates } from "@/lib/services/candidate-service";

export async function GET() {
  try {
    const candidates = await getCandidates();
    const csv = Papa.unparse(candidates);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="candidates-export-${Date.now()}.csv"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to export candidates.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
