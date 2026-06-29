import { NextResponse } from "next/server";
import {
  updateJobDescription,
  deleteJobDescription,
} from "@/lib/services/job-description-service";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobDescriptionId = Number(id);

  if (!Number.isFinite(jobDescriptionId)) {
    return NextResponse.json({ error: "Invalid job description id." }, { status: 400 });
  }

  try {
    const body = await req.json();

    if (typeof body?.title !== "string" || typeof body?.requirements !== "string") {
      return NextResponse.json({ error: "title and requirements are required." }, { status: 400 });
    }

    const jobDescription = await updateJobDescription(jobDescriptionId, {
      title: body.title,
      requirements: body.requirements,
    });

    return NextResponse.json(jobDescription);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update job description.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobDescriptionId = Number(id);

  if (!Number.isFinite(jobDescriptionId)) {
    return NextResponse.json({ error: "Invalid job description id." }, { status: 400 });
  }

  try {
    await deleteJobDescription(jobDescriptionId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete job description.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
