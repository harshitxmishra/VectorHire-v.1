import { NextResponse } from 'next/server';
import { handleProspectApprovalAction } from '@/lib/services/sourcer-agent';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const prospectId = Number(resolvedParams.id);

    if (!Number.isFinite(prospectId) || prospectId <= 0) {
      return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    const body = await req.json();
    const action = (body.action || 'APPROVE').toUpperCase();

    if (!['APPROVE', 'REJECT', 'IMPORT'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be one of APPROVE, REJECT, or IMPORT' },
        { status: 400 }
      );
    }

    const result = await handleProspectApprovalAction({
      prospectId,
      action: action as 'APPROVE' | 'REJECT' | 'IMPORT',
      customEmailBody: body.custom_email_body,
      reviewer: body.reviewer || 'recruiter@vectorhire.ai',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Prospect approval action failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process approval action' },
      { status: 500 }
    );
  }
}
