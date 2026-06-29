import { NextResponse } from "next/server";
import {
  getJobDescriptions,
  createJobDescription,
} from "@/lib/services/job-description-service";

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

    if (typeof body?.title !== "string" || typeof body?.requirements !== "string") {
      return NextResponse.json({ error: "title and requirements are required." }, { status: 400 });
    }

    const jobDescription = await createJobDescription({
      title: body.title,
      requirements: body.requirements,
    });

    return NextResponse.json(jobDescription);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create job description.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
