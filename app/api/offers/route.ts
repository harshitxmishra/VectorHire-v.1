import { NextResponse } from 'next/server';
import { createOfferLetter } from '@/lib/services/offer-letter-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const candidateId = Number(body.candidateId ?? body.candidate_id);
    const roleTitle = typeof body.roleTitle === 'string' ? body.roleTitle.trim() : body.role_title;
    const annualSalary = Number(body.annualSalary ?? body.annual_salary);
    const currency = typeof body.currency === 'string' ? body.currency.trim() : 'USD';
    const startDate = typeof body.startDate === 'string' ? body.startDate : body.start_date;
    const expirationDays = Number(body.expirationDays ?? body.expiration_days ?? 7);

    if (!Number.isFinite(candidateId) || candidateId <= 0) {
      return NextResponse.json({ error: 'Valid candidateId is required' }, { status: 400 });
    }
    if (!roleTitle) {
      return NextResponse.json({ error: 'roleTitle is required' }, { status: 400 });
    }
    if (!Number.isFinite(annualSalary) || annualSalary <= 0) {
      return NextResponse.json({ error: 'Valid annualSalary is required' }, { status: 400 });
    }
    if (!startDate || isNaN(Date.parse(startDate))) {
      return NextResponse.json({ error: 'Valid startDate is required' }, { status: 400 });
    }

    const offer = await createOfferLetter({
      candidateId,
      roleTitle,
      annualSalary,
      currency,
      startDate,
      expirationDays,
    });

    return NextResponse.json(offer, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create offer letter';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
