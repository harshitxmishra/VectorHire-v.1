import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import {
  runSourcerAgent,
  memSourcedProspects,
} from '@/lib/services/sourcer-agent';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jdId = searchParams.get('job_description_id');

    let query = supabase
      .from('sourced_prospects')
      .select('*')
      .order('created_at', { ascending: false });

    if (jdId) {
      query = query.eq('job_description_id', Number(jdId));
    }

    const { data, error } = await query;

    if (!error && Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }
  } catch {
    // Fallback to memory
  }

  // Return in-memory prospects
  const memList = Array.from(memSourcedProspects.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return NextResponse.json(memList);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      job_description_id,
      role_title,
      requirements,
      target_skills,
      seniority,
      max_prospects,
    } = body;

    if (!job_description_id) {
      return NextResponse.json(
        { error: 'Missing job_description_id in request body' },
        { status: 400 }
      );
    }

    // Optionally load JD details from database if not supplied
    let resolvedTitle = role_title;
    let resolvedReqs = requirements;

    if (!resolvedTitle || !resolvedReqs) {
      try {
        const { data: jd } = await supabase
          .from('job_descriptions')
          .select('*')
          .eq('id', job_description_id)
          .single();
        if (jd) {
          resolvedTitle = resolvedTitle || jd.title;
          resolvedReqs = resolvedReqs || jd.requirements;
        }
      } catch {
        // Fallback
      }
    }

    const prospects = await runSourcerAgent({
      job_description_id: Number(job_description_id),
      role_title: resolvedTitle || 'Senior Software Engineer',
      requirements: resolvedReqs || 'TypeScript, Node.js, PostgreSQL, BullMQ, Redis',
      target_skills,
      seniority,
      max_prospects: max_prospects || 3,
    });

    return NextResponse.json({
      success: true,
      count: prospects.length,
      prospects,
    });
  } catch (error: any) {
    console.error('Error executing sourcing run:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to execute autonomous sourcing run' },
      { status: 500 }
    );
  }
}
