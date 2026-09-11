import { NextResponse } from "next/server";
import {
  getJobDescriptions,
  createJobDescription,
} from "@/lib/services/job-description-service";
import { validateJobDescriptionInput } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const jobDescriptions = await getJobDescriptions();
    return NextResponse.json(jobDescriptions);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load job descriptions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = validateJobDescriptionInput(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error, field: validation.field }, { status: 400 });
    }

    const jobDescription = await createJobDescription(validation.data);
    return NextResponse.json(jobDescription, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create job description.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
