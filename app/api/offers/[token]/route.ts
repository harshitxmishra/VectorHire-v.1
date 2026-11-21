import { NextResponse } from 'next/server';
import { getOfferByToken, respondToOffer } from '@/lib/services/offer-letter-service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const result = await getOfferByToken(token);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve offer';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const action = body.action; // 'accept' | 'decline'
    const reason = body.reason;

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json({ error: "Action must be 'accept' or 'decline'" }, { status: 400 });
    }

    const result = await respondToOffer(token, action, reason);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process offer response';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
