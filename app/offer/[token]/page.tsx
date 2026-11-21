'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
  Badge,
  Spinner,
  Textarea,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Filled,
  DismissCircle24Filled,
  ArrowDownload24Regular,
  Briefcase20Regular,
  Calendar20Regular,
  Money20Regular,
  Clock20Regular,
} from '@fluentui/react-icons';
import { OfferLetter } from '@/lib/types';

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacingVerticalXXL,
  },
  card: {
    width: '100%',
    maxWidth: '720px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow16,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.overflow('hidden'),
  },
  header: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXXL}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brand: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: '#38bdf8',
  },
  body: {
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXXL}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  title: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  highlightGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: tokens.spacingHorizontalM,
    margin: `${tokens.spacingVerticalM} 0`,
  },
  infoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke3),
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  statusBanner: {
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    fontWeight: 600,
  },
});

export default function CandidateOfferPortalPage() {
  const styles = useStyles();
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<OfferLetter | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/offers/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('Offer not found or invalid link');
        return res.json();
      })
      .then((data) => {
        setOffer(data.offer);
        setDownloadUrl(data.downloadUrl);
        setIsExpired(data.isExpired);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const handleResponse = async (action: 'accept' | 'decline') => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/offers/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: declineReason }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to submit response');
      }

      const updated = await res.json();
      setOffer((prev) => (prev ? { ...prev, status: updated.status } : null));
      setDeclineOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error processing request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Spinner label="Loading offer details..." size="large" />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ padding: '40px', textAlign: 'center' }}>
          <DismissCircle24Filled primaryFill={tokens.colorPaletteRedForeground1} style={{ fontSize: 48 }} />
          <h2>Unable to Load Offer</h2>
          <p>{error || 'This offer link may be expired, revoked, or invalid.'}</p>
        </div>
      </div>
    );
  }

  const candidateName =
    (Array.isArray(offer.candidates) ? offer.candidates[0]?.full_name : offer.candidates?.full_name) ||
    'Candidate';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <div className={styles.brand}>VectorHire</div>
            <div style={{ fontSize: tokens.fontSizeBase200, opacity: 0.8, marginTop: 4 }}>
              Formal Employment Offer
            </div>
          </div>
          <div>
            {offer.status === 'accepted' && (
              <Badge appearance="filled" color="success" size="large">
                Accepted
              </Badge>
            )}
            {offer.status === 'declined' && (
              <Badge appearance="filled" color="danger" size="large">
                Declined
              </Badge>
            )}
            {offer.status === 'sent' && !isExpired && (
              <Badge appearance="filled" color="brand" size="large">
                Action Required
              </Badge>
            )}
            {isExpired && offer.status === 'sent' && (
              <Badge appearance="filled" color="warning" size="large">
                Expired
              </Badge>
            )}
          </div>
        </div>

        <div className={styles.body}>
          <div>
            <h1 className={styles.title}>Offer for {candidateName}</h1>
            <p style={{ color: tokens.colorNeutralForeground3, marginTop: 4 }}>
              Congratulations! VectorHire is pleased to offer you the position of{' '}
              <strong>{offer.role_title}</strong>.
            </p>
          </div>

          {offer.status === 'accepted' && (
            <div
              className={styles.statusBanner}
              style={{ backgroundColor: '#dcfce7', color: '#166534' }}
            >
              <CheckmarkCircle24Filled primaryFill="#16a34a" />
              <span>You have accepted this offer. Our onboarding team will contact you shortly!</span>
            </div>
          )}

          {offer.status === 'declined' && (
            <div
              className={styles.statusBanner}
              style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
            >
              <DismissCircle24Filled primaryFill="#dc2626" />
              <span>You have declined this offer. Thank you for your time throughout the process.</span>
            </div>
          )}

          <div className={styles.highlightGrid}>
            <div className={styles.infoBox}>
              <Briefcase20Regular style={{ color: tokens.colorBrandForeground1 }} />
              <div>
                <div style={{ fontSize: 12, color: tokens.colorNeutralForeground4 }}>Role</div>
                <div style={{ fontWeight: 600 }}>{offer.role_title}</div>
              </div>
            </div>

            <div className={styles.infoBox}>
              <Money20Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />
              <div>
                <div style={{ fontSize: 12, color: tokens.colorNeutralForeground4 }}>Annual Compensation</div>
                <div style={{ fontWeight: 700, color: tokens.colorPaletteGreenForeground1 }}>
                  {offer.currency} {Number(offer.annual_salary).toLocaleString()}
                </div>
              </div>
            </div>

            <div className={styles.infoBox}>
              <Calendar20Regular style={{ color: tokens.colorBrandForeground1 }} />
              <div>
                <div style={{ fontSize: 12, color: tokens.colorNeutralForeground4 }}>Start Date</div>
                <div style={{ fontWeight: 600 }}>
                  {new Date(offer.start_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className={styles.infoBox}>
              <Clock20Regular style={{ color: tokens.colorPaletteYellowForeground1 }} />
              <div>
                <div style={{ fontSize: 12, color: tokens.colorNeutralForeground4 }}>Offer Expiration</div>
                <div style={{ fontWeight: 600 }}>
                  {new Date(offer.expiration_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: tokens.spacingHorizontalM }}>
            <Button
              as="a"
              href={downloadUrl || `/api/offers/${token}/pdf`}
              target="_blank"
              icon={<ArrowDownload24Regular />}
              appearance="secondary"
            >
              Download Formal Offer Letter (PDF / HTML)
            </Button>
          </div>

          {offer.status === 'sent' && !isExpired && (
            <div className={styles.actions}>
              <Button
                appearance="subtle"
                onClick={() => setDeclineOpen(true)}
                disabled={submitting}
              >
                Decline Offer
              </Button>
              <Button
                appearance="primary"
                onClick={() => handleResponse('accept')}
                disabled={submitting}
              >
                {submitting ? 'Accepting...' : 'Accept Offer'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={declineOpen} onOpenChange={(_, data) => setDeclineOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Decline Offer</DialogTitle>
            <DialogContent>
              <p>Are you sure you want to decline this offer? Please let us know the reason (optional):</p>
              <Textarea
                value={declineReason}
                onChange={(_, d) => setDeclineReason(d.value)}
                placeholder="Reason for declining..."
                style={{ width: '100%', marginTop: 8 }}
              />
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                style={{ backgroundColor: '#dc2626', color: '#fff' }}
                onClick={() => handleResponse('decline')}
                disabled={submitting}
              >
                Confirm Decline
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
