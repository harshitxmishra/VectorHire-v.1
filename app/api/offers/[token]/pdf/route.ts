import { NextResponse } from 'next/server';
import { getOfferByToken, renderOfferDocumentHtml } from '@/lib/services/offer-letter-service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { offer, downloadUrl } = await getOfferByToken(token);

    // If downloadUrl is a direct presigned S3 url, redirect directly to it
    if (downloadUrl && downloadUrl.startsWith('http') && !downloadUrl.includes('/api/offers/')) {
      return NextResponse.redirect(downloadUrl);
    }

    const candidateName =
      (Array.isArray(offer.candidates) ? offer.candidates[0]?.full_name : offer.candidates?.full_name) ||
      'Candidate';

    const html = renderOfferDocumentHtml({
      candidateName,
      roleTitle: offer.role_title,
      annualSalary: Number(offer.annual_salary),
      currency: offer.currency,
      startDate: offer.start_date,
      expirationDate: offer.expiration_date,
    });

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="Offer_Letter_${candidateName.replace(/\s+/g, '_')}.html"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Offer not found';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
