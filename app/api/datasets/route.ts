import { NextResponse } from "next/server";
import { getDatasetUploads } from "@/lib/services/dataset-service";

export async function GET() {
  try {
    const datasets = await getDatasetUploads();
    return NextResponse.json(datasets);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load datasets.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
