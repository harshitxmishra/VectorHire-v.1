import { NextResponse } from "next/server";
import {
  getJobDescriptionById,
  updateJobDescription,
  deleteJobDescription,
} from "@/lib/services/job-description-service";
import { validateJobDescriptionInput } from "@/lib/validation/schemas";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobDescriptionId = Number(id);

  if (!Number.isFinite(jobDescriptionId) || jobDescriptionId <= 0) {
    return NextResponse.json({ error: "Invalid job description id. Must be a positive integer." }, { status: 400 });
  }

  try {
    const jobDescription = await getJobDescriptionById(jobDescriptionId);
    if (!jobDescription) {
      return NextResponse.json({ error: `Job description with ID ${jobDescriptionId} not found.` }, { status: 404 });
    }
    return NextResponse.json(jobDescription);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load job description.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobDescriptionId = Number(id);

  if (!Number.isFinite(jobDescriptionId) || jobDescriptionId <= 0) {
    return NextResponse.json({ error: "Invalid job description id. Must be a positive integer." }, { status: 400 });
  }

  try {
    const body = await req.json();
    const validation = validateJobDescriptionInput(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error, field: validation.field }, { status: 400 });
    }

    const jobDescription = await updateJobDescription(jobDescriptionId, validation.data);
    return NextResponse.json(jobDescription);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update job description.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobDescriptionId = Number(id);

  if (!Number.isFinite(jobDescriptionId) || jobDescriptionId <= 0) {
    return NextResponse.json({ error: "Invalid job description id. Must be a positive integer." }, { status: 400 });
  }

  try {
    await deleteJobDescription(jobDescriptionId);
    return NextResponse.json({ success: true, message: `Job description ${jobDescriptionId} deleted.` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete job description.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
