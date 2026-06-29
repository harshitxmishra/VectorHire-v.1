'use client';

import {
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Dropdown,
  Option,
  Input,
  Button,
  Field,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useState } from 'react';
import { Candidate } from '@/lib/types';

const useStyles = makeStyles({
  body: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL, paddingTop: tokens.spacingVerticalL },
});

interface ScheduleInterviewDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultDate: Date | null;
  candidates: Candidate[];
  onScheduled: () => void;
}

export function ScheduleInterviewDrawer({
  open,
  onClose,
  defaultDate,
  candidates,
  onScheduled,
}: ScheduleInterviewDrawerProps) {
  const styles = useStyles();
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [interviewerName, setInterviewerName] = useState('');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!candidateId || !interviewerName.trim() || !defaultDate) {
      setError('Candidate and interviewer are required.');
      return;
    }
    setSaving(true);
    setError(null);

    const [hours, minutes] = time.split(':').map(Number);
    const scheduled = new Date(defaultDate);
    scheduled.setHours(hours, minutes, 0, 0);

    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidateId,
          interviewer_name: interviewerName,
          scheduled_date: scheduled.toISOString(),
          duration_minutes: duration,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to schedule interview.');

      onScheduled();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule interview.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OverlayDrawer open={open} onOpenChange={(_, state) => !state.open && onClose()} position="end">
      <DrawerHeader>
        <DrawerHeaderTitle>
          Schedule Interview {defaultDate ? `— ${defaultDate.toLocaleDateString()}` : ''}
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody className={styles.body}>
        {error ? <Field validationState="error" validationMessage={error} /> : null}

        <Field label="Candidate">
          <Dropdown
            placeholder="Select candidate"
            onOptionSelect={(_, data) => setCandidateId(data.optionValue ? Number(data.optionValue) : null)}
          >
            {candidates.map((c) => (
              <Option key={c.id} value={String(c.id)}>
                {c.full_name}
              </Option>
            ))}
          </Dropdown>
        </Field>

        <Field label="Interviewer">
          <Input value={interviewerName} onChange={(_, data) => setInterviewerName(data.value)} />
        </Field>

        <Field label="Time">
          <Input type="time" value={time} onChange={(_, data) => setTime(data.value)} />
        </Field>

        <Field label="Duration (minutes)">
          <Dropdown
            value={String(duration)}
            onOptionSelect={(_, data) => data.optionValue && setDuration(Number(data.optionValue))}
          >
            <Option value="30">30</Option>
            <Option value="45">45</Option>
            <Option value="60">60</Option>
            <Option value="90">90</Option>
          </Dropdown>
        </Field>

        <Button appearance="primary" disabled={saving} onClick={save}>
          {saving ? 'Saving...' : 'Save Interview'}
        </Button>
      </DrawerBody>
    </OverlayDrawer>
  );
}
