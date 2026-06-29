'use client';

import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  Caption1,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useMemo, useState } from 'react';
import { Candidate, JobMatchResult } from '@/lib/types';
import { compositeScore } from '@/lib/utils/scoring';

const useStyles = makeStyles({
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  name: { fontWeight: 600 },
});

interface ShortlistDialogProps {
  open: boolean;
  onClose: () => void;
  candidates: Candidate[];
  matches: Record<number, JobMatchResult>;
  onConfirm: (candidateIds: number[]) => Promise<void>;
}

export function ShortlistDialog({ open, onClose, candidates, matches, onConfirm }: ShortlistDialogProps) {
  const styles = useStyles();
  const [confirming, setConfirming] = useState(false);

  const ranked = useMemo(
    () =>
      [...candidates]
        .map((c) => ({ candidate: c, score: compositeScore(c, matches) }))
        .sort((a, b) => b.score - a.score),
    [candidates, matches]
  );

  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(ranked.slice(0, Math.ceil(ranked.length * 0.3)).map((r) => r.candidate.id))
  );

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confirm = async () => {
    setConfirming(true);
    await onConfirm(Array.from(selected));
    setConfirming(false);
  };

  return (
    <Dialog open={open} onOpenChange={(_, state) => !state.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Generate Shortlist</DialogTitle>
          <DialogContent>
            <Caption1>
              Ranked by AI Score + JD Match + GitHub Score + Assessment Score (whichever are available).
              Top 30% pre-selected — override as needed.
            </Caption1>
            {ranked.map(({ candidate, score }) => (
              <div key={candidate.id} className={styles.row}>
                <Checkbox
                  checked={selected.has(candidate.id)}
                  onChange={() => toggle(candidate.id)}
                  label={<span className={styles.name}>{candidate.full_name}</span>}
                />
                <span>{score}</span>
              </div>
            ))}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button appearance="primary" disabled={confirming} onClick={confirm}>
              {confirming ? 'Updating...' : `Shortlist ${selected.size} Candidates`}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
