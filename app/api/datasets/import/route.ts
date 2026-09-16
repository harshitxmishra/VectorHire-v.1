import { NextResponse } from "next/server";
import { parseCSV, mapCandidateRow } from "@/lib/utils/csv-parser";
import { importDatasetAtomic } from "@/lib/services/dataset-service";
import { verifyServerAuth } from "@/lib/auth/server-auth";

export async function POST(req: Request) {
  const auth = await verifyServerAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mode = (formData.get("mode") as string | null) === "replace" ? "replace" : "append";
    const datasetName = (formData.get("datasetName") as string | null) || file?.name || "Untitled dataset";
    const uploadedBy = (formData.get("uploadedBy") as string | null) || auth.user?.email || null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);
    const candidates = rows.map(mapCandidateRow).filter((row) => row !== null);

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "No valid candidate rows found. Make sure the CSV has Name and Email columns." },
        { status: 400 }
      );
    }

    // Atomic transaction: dataset creation, replacement/append, candidates insertion,
    // and lifecycle timeline logging occur atomically in a single PostgreSQL transaction.
    const result = await importDatasetAtomic({
      dataset_name: datasetName,
      uploaded_by: uploadedBy,
      mode,
      candidates,
    });

    return NextResponse.json({
      success: true,
      inserted: result.total_candidates,
      datasetId: result.dataset_id,
      mode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
