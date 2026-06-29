import { NextResponse } from "next/server";
import { parseCSV, mapTestResultRow } from "@/lib/utils/csv-parser";
import { updateTestResultByEmail } from "@/lib/services/candidate-service";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);
    const results = rows.map(mapTestResultRow).filter((row) => row !== null);

    let matched = 0;
    for (const result of results) {
      const { matched: rowsMatched } = await updateTestResultByEmail(
        result.email,
        result.test_la,
        result.test_code
      );
      matched += rowsMatched;
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      matched,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
