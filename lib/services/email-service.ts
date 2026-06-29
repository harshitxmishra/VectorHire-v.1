import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase/client';
import { logTimelineEvent } from '@/lib/services/timeline-service';

export type EmailType = 'assessment' | 'interview' | 'offer';

function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD are not configured.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

interface EmailExtra {
  assessmentUrl?: string;
  assessmentTitle?: string;
  assessmentDeadline?: string;
  recruiterName?: string;
  interviewDate?: string;
  meetLink?: string;
}

function buildTemplate(
  type: EmailType,
  candidateName: string,
  extra?: EmailExtra
): { subject: string; html: string } {
  switch (type) {
    case 'assessment': {
      const title = extra?.assessmentTitle ?? 'Technical Assessment';
      const recruiter = extra?.recruiterName ?? 'VectorHire Recruiting Team';
      return {
        subject: `Next Step: Complete Your ${title}`,
        html: `
          <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto;">
            <h2 style="color:#1f2937;">Hi ${candidateName},</h2>
            <p style="color:#374151;">Congratulations on advancing in our hiring process! Please complete the following assessment to move forward:</p>
            <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding:8px 0; color:#6b7280;">Assessment</td><td style="padding:8px 0; font-weight:600; color:#111827;">${title}</td></tr>
              ${extra?.assessmentDeadline ? `<tr><td style="padding:8px 0; color:#6b7280;">Deadline</td><td style="padding:8px 0; font-weight:600; color:#111827;">${extra.assessmentDeadline}</td></tr>` : ''}
            </table>
            ${extra?.assessmentUrl ? `<p><a href="${extra.assessmentUrl}" style="display:inline-block; background:#2563eb; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none;">Start Assessment</a></p>` : ''}
            <p style="color:#374151;">Best of luck,<br/>${recruiter}</p>
          </div>`,
      };
    }
    case 'interview':
      return {
        subject: 'Interview Scheduled',
        html: `<p>Hi ${candidateName},</p><p>Your interview has been scheduled${
          extra?.interviewDate ? ` for ${extra.interviewDate}` : ''
        }.${extra?.meetLink ? ` Join here: <a href="${extra.meetLink}">${extra.meetLink}</a>` : ''}</p><p>Best,<br/>VectorHire Recruiting Team</p>`,
      };
    case 'offer':
      return {
        subject: 'Offer of Employment',
        html: `<p>Hi ${candidateName},</p><p>Congratulations! We're excited to extend you an offer. Our team will follow up with details shortly.</p><p>Best,<br/>VectorHire Recruiting Team</p>`,
      };
  }
}

export async function sendCandidateEmail(
  candidateId: number,
  type: EmailType,
  recipient: string,
  candidateName: string,
  extra?: EmailExtra
): Promise<{ status: 'sent' | 'failed'; error?: string }> {
  const { data: log } = await supabase
    .from('email_logs')
    .insert({ candidate_id: candidateId, email_type: type, recipient, status: 'pending' })
    .select()
    .single();

  try {
    const transporter = getTransporter();
    const { subject, html } = buildTemplate(type, candidateName, extra);

    // Demo mode: deliver to a single inbox instead of the candidate's real
    // address, while email_logs.recipient still records the intended
    // recipient for accurate tracking. Set DEMO_EMAIL_OVERRIDE in .env.local;
    // remove it to send to real candidate addresses again.
    const deliverTo = process.env.DEMO_EMAIL_OVERRIDE || recipient;
    const subjectPrefix = process.env.DEMO_EMAIL_OVERRIDE ? `[Demo — intended for ${recipient}] ` : '';

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: deliverTo,
      subject: `${subjectPrefix}${subject}`,
      html,
    });

    if (log) {
      await supabase
        .from('email_logs')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', log.id);
    }

    await logTimelineEvent(candidateId, `${type}_sent`, `Email sent to ${recipient}`);
    return { status: 'sent' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email.';

    if (log) {
      await supabase.from('email_logs').update({ status: 'failed', error_message: message }).eq('id', log.id);
    }

    return { status: 'failed', error: message };
  }
}
