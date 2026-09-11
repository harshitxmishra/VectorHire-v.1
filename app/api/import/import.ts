import { NextResponse } from "next/server";
import { parseCSV, mapCandidateRow } from "@/lib/utils/csv-parser";
import { insertCandidates } from "@/lib/services/candidate-service";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    const csvText = await file.text();

    const rows = parseCSV(csvText);
    const candidates = rows.map(mapCandidateRow).filter((r): r is NonNullable<typeof r> => r !== null);

    const inserted = await insertCandidates(candidates);

    return NextResponse.json({
      success: true,
      inserted: inserted.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}