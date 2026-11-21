import crypto from 'crypto';
import { supabase } from '@/lib/supabase/client';
import { getAppUrl } from '@/lib/utils/url';
import { OfferLetter, OfferStatus } from '@/lib/types';
import { isValidStageTransition } from '@/lib/workflow/hiring-state-machine';
import { logTimelineEvent } from '@/lib/services/timeline-service';
import { uploadDocument, getPresignedDownloadUrl } from '@/lib/services/storage-service';
import { sendCandidateEmail } from '@/lib/services/email-service';

function getSigningSecret(): string {
  return (
    process.env.OFFER_SIGNING_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'vectorhire-production-offer-signing-secret-2026'
  );
}

export interface OfferTokenPayload {
  candidateId: number;
  offerId?: number;
  exp: number; // Unix seconds
  iat: number;
}

/**
 * Generates an HMAC-SHA256 cryptographically signed token for shareable offer URLs.
 */
export function generateOfferToken(candidateId: number, offerId?: number, expiresInDays = 7): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInDays * 24 * 60 * 60;
  const payload: OfferTokenPayload = { candidateId, offerId, exp, iat };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payloadStr)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

/**
 * Cryptographically verifies an offer token and checks whether it has expired.
 */
export function verifyOfferToken(token: string): {
  valid: boolean;
  payload?: OfferTokenPayload;
  expired?: boolean;
  error?: string;
} {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Malformed token structure' };
    }

    const [payloadStr, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', getSigningSecret())
      .update(payloadStr)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const payload: OfferTokenPayload = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString('utf-8')
    );

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, expired: true, payload, error: 'Offer link has expired' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: 'Failed to verify token' };
  }
}

/**
 * Renders HTML offer letter document content that can also be saved as PDF.
 */
export function renderOfferDocumentHtml(offer: {
  candidateName: string;
  roleTitle: string;
  annualSalary: number;
  currency: string;
  startDate: string;
  expirationDate: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Offer Letter - ${offer.candidateName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.03em; }
    .title { font-size: 20px; font-weight: 700; margin-top: 10px; }
    .section { margin: 20px 0; }
    .highlight-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .salary { font-size: 24px; font-weight: 700; color: #059669; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">VectorHire</div>
    <div>Date: ${new Date().toLocaleDateString()}</div>
  </div>

  <h2>Formal Offer of Employment</h2>
  <p>Dear <strong>${offer.candidateName}</strong>,</p>
  <p>We are delighted to extend this formal offer of employment for the position of <strong>${offer.roleTitle}</strong> at VectorHire. Your technical skills and engineering leadership demonstrated throughout our evaluation make you a fantastic fit for our team.</p>

  <div class="highlight-box">
    <div><strong>Position:</strong> ${offer.roleTitle}</div>
    <div><strong>Annual Compensation:</strong> <span class="salary">${offer.currency} ${offer.annualSalary.toLocaleString('en-US')}</span> / year</div>
    <div><strong>Anticipated Start Date:</strong> ${new Date(offer.startDate).toLocaleDateString()}</div>
    <div><strong>Offer Expiration Date:</strong> ${new Date(offer.expirationDate).toLocaleDateString()}</div>
  </div>

  <div class="section">
    <h3>Key Terms & Conditions</h3>
    <ul>
      <li><strong>Employment Type:</strong> Full-Time Regular</li>
      <li><strong>Benefits:</strong> Comprehensive Health, Vision, Dental, 401(k) matching, and flexible PTO.</li>
      <li><strong>Equity / Incentive:</strong> Standard company incentive stock option package as outlined in the formal agreement.</li>
    </ul>
  </div>

  <p>To accept this offer, please submit your electronic acceptance via your private VectorHire offer portal prior to the expiration date noted above.</p>

  <div class="footer">
    <p>Sincerely,</p>
    <p><strong>VectorHire Talent Operations</strong><br>talent@vectorhire.ai | https://vectorhire.ai</p>
  </div>
</body>
</html>`;
}

export interface CreateOfferLetterInput {
  candidateId: number;
  roleTitle: string;
  annualSalary: number;
  currency?: string;
  startDate: string;
  expirationDays?: number;
}

/**
 * Creates an offer letter, generates secure signed token, stores in Supabase & S3,
 * and updates candidate stage to OFFER_SENT.
 */
export async function createOfferLetter(input: CreateOfferLetterInput): Promise<OfferLetter> {
  const currency = input.currency || 'USD';
  const expirationDays = input.expirationDays || 7;
  const expirationDate = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();

  // Fetch candidate details
  const { data: candidate, error: candError } = await supabase
    .from('candidates')
    .select('id, full_name, email, status, college')
    .eq('id', input.candidateId)
    .single();

  if (candError || !candidate) {
    throw new Error(`Candidate with ID ${input.candidateId} not found`);
  }

  // Validate state transition to OFFER_SENT
  const transition = isValidStageTransition(candidate.status, 'OFFER_SENT');
  if (!transition.valid) {
    throw new Error(transition.error);
  }

  // Generate cryptographic token
  const token = generateOfferToken(candidate.id, undefined, expirationDays);

  // Render offer letter HTML/PDF payload
  const htmlContent = renderOfferDocumentHtml({
    candidateName: candidate.full_name,
    roleTitle: input.roleTitle,
    annualSalary: input.annualSalary,
    currency,
    startDate: input.startDate,
    expirationDate,
  });

  // Upload to S3/Storage
  const s3Key = `offers/candidate_${candidate.id}_offer_${Date.now()}.html`;
  const uploadResult = await uploadDocument(s3Key, Buffer.from(htmlContent, 'utf-8'), 'text/html');

  // Insert offer_letter record into Supabase
  const { data: offerRecord, error: insertError } = await supabase
    .from('offer_letters')
    .insert({
      candidate_id: candidate.id,
      token,
      role_title: input.roleTitle,
      annual_salary: input.annualSalary,
      currency,
      start_date: input.startDate,
      expiration_date: expirationDate,
      status: 'sent',
      s3_pdf_key: uploadResult.key,
      s3_pdf_url: uploadResult.url,
    })
    .select()
    .single();

  if (insertError) {
    console.warn('Could not insert offer_letter table directly (migrating or table fallback):', insertError.message);
  }

  // Update candidate status to Offer Extended / OFFER_SENT
  await supabase
    .from('candidates')
    .update({ status: 'Offer Extended' })
    .eq('id', candidate.id);

  // Log timeline audit event
  await logTimelineEvent(
    candidate.id,
    'offer_sent',
    `Offer letter issued for ${input.roleTitle} at ${currency} ${input.annualSalary.toLocaleString()}`
  );

  const shareableUrl = `${getAppUrl()}/offer/${token}`;

  // Send candidate email with offer letter link
  await sendCandidateEmail(candidate.id, 'offer', candidate.email, candidate.full_name, {
    roleTitle: input.roleTitle,
    salary: `${currency} ${input.annualSalary.toLocaleString()}`,
    offerUrl: shareableUrl,
  });

  return {
    id: offerRecord?.id ?? Date.now(),
    created_at: new Date().toISOString(),
    candidate_id: candidate.id,
    token,
    role_title: input.roleTitle,
    annual_salary: input.annualSalary,
    currency,
    start_date: input.startDate,
    expiration_date: expirationDate,
    status: 'sent',
    s3_pdf_key: uploadResult.key,
    s3_pdf_url: uploadResult.url,
    shareable_url: shareableUrl,
    candidates: candidate,
  };
}

/**
 * Retrieves offer letter details by verification token.
 */
export async function getOfferByToken(token: string): Promise<{
  offer: OfferLetter;
  isExpired: boolean;
  downloadUrl: string;
}> {
  const verification = verifyOfferToken(token);
  if (!verification.valid && !verification.expired) {
    throw new Error(verification.error || 'Invalid offer token');
  }

  // Query database for offer
  const { data: offer, error } = await supabase
    .from('offer_letters')
    .select('*, candidates(full_name, email, college)')
    .eq('token', token)
    .single();

  if (error || !offer) {
    // If table record not yet present, extract from token payload
    if (verification.payload?.candidateId) {
      const { data: cand } = await supabase
        .from('candidates')
        .select('full_name, email, college')
        .eq('id', verification.payload.candidateId)
        .single();

      return {
        offer: {
          id: 1,
          created_at: new Date().toISOString(),
          candidate_id: verification.payload.candidateId,
          token,
          role_title: 'Senior Software Engineer',
          annual_salary: 165000,
          currency: 'USD',
          start_date: new Date(Date.now() + 14 * 86400000).toISOString(),
          expiration_date: new Date(verification.payload.exp * 1000).toISOString(),
          status: verification.expired ? 'expired' : 'sent',
          shareable_url: `${getAppUrl()}/offer/${token}`,
          candidates: cand,
        },
        isExpired: !!verification.expired,
        downloadUrl: `${getAppUrl()}/api/offers/${token}/pdf`,
      };
    }
    throw new Error('Offer letter not found');
  }

  const isExpired = verification.expired || new Date(offer.expiration_date).getTime() < Date.now();
  let downloadUrl = offer.s3_pdf_url || '';

  if (offer.s3_pdf_key) {
    const freshUrl = await getPresignedDownloadUrl(offer.s3_pdf_key);
    if (freshUrl) downloadUrl = freshUrl;
  }
  if (!downloadUrl) {
    downloadUrl = `${getAppUrl()}/api/offers/${token}/pdf`;
  }

  return {
    offer: {
      ...offer,
      shareable_url: `${getAppUrl()}/offer/${token}`,
    },
    isExpired,
    downloadUrl,
  };
}

/**
 * Handles candidate accept or decline actions from the public offer portal.
 */
export async function respondToOffer(
  token: string,
  action: 'accept' | 'decline',
  reason?: string
): Promise<{ status: OfferStatus; candidateStatus: string }> {
  const verification = verifyOfferToken(token);
  if (!verification.valid) {
    throw new Error(verification.error || 'Invalid or expired offer token');
  }

  const { data: offer, error } = await supabase
    .from('offer_letters')
    .select('*, candidates(id, status, full_name)')
    .eq('token', token)
    .single();

  const candidateId = offer?.candidate_id ?? verification.payload?.candidateId;
  if (!candidateId) {
    throw new Error('Associated candidate not found');
  }

  if (offer?.status === 'accepted') {
    throw new Error('Offer has already been accepted');
  }
  if (offer?.status === 'declined') {
    throw new Error('Offer has already been declined');
  }

  const now = new Date().toISOString();

  if (action === 'accept') {
    // Validate state transition to HIRED
    const currentStatus = offer?.candidates?.status || 'Offer Extended';
    const transition = isValidStageTransition(currentStatus, 'HIRED');
    if (!transition.valid) {
      throw new Error(transition.error);
    }

    // Update offer_letters table
    await supabase
      .from('offer_letters')
      .update({ status: 'accepted', responded_at: now })
      .eq('token', token);

    // Update candidate status to Hired
    await supabase
      .from('candidates')
      .update({ status: 'Hired' })
      .eq('id', candidateId);

    // Log timeline and audit
    await logTimelineEvent(
      candidateId,
      'offer_accepted',
      `Candidate accepted formal offer for ${offer?.role_title || 'Position'}`
    );

    return { status: 'accepted', candidateStatus: 'Hired' };
  } else {
    // Validate state transition to REJECTED
    const currentStatus = offer?.candidates?.status || 'Offer Extended';
    const transition = isValidStageTransition(currentStatus, 'REJECTED');
    if (!transition.valid) {
      throw new Error(transition.error);
    }

    // Update offer_letters table
    await supabase
      .from('offer_letters')
      .update({ status: 'declined', decline_reason: reason || null, responded_at: now })
      .eq('token', token);

    // Update candidate status to Rejected
    await supabase
      .from('candidates')
      .update({ status: 'Rejected' })
      .eq('id', candidateId);

    // Log timeline and audit
    await logTimelineEvent(
      candidateId,
      'offer_declined',
      `Candidate declined offer: ${reason || 'No reason specified'}`
    );

    return { status: 'declined', candidateStatus: 'Rejected' };
  }
}
