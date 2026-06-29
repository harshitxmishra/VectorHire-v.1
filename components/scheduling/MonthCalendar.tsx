'use client';

import { Button, Caption1, makeStyles, tokens } from '@fluentui/react-components';
import { ChevronLeftRegular, ChevronRightRegular } from '@fluentui/react-icons';
import { useState } from 'react';
import { Interview } from '@/lib/types';

const useStyles = makeStyles({
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacingVerticalM },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: tokens.spacingVerticalS },
  dayLabel: { textAlign: 'center', color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  cell: {
    minHeight: '72px',
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    ':hover': { backgroundColor: tokens.colorNeutralBackground2Hover },
  },
  faded: { opacity: 0.35 },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground,
    display: 'inline-block',
    marginRight: '4px',
  },
});

interface MonthCalendarProps {
  interviews: Interview[];
  onDayClick: (date: Date) => void;
}

export function MonthCalendar({ interviews, onDayClick }: MonthCalendarProps) {
  const styles = useStyles();
  const [cursor, setCursor] = useState(new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const interviewsByDay = new Map<string, number>();
  interviews.forEach((i) => {
    const key = new Date(i.scheduled_date).toDateString();
    interviewsByDay.set(key, (interviewsByDay.get(key) ?? 0) + 1);
  });

  return (
    <div>
      <div className={styles.header}>
        <Button appearance="subtle" icon={<ChevronLeftRegular />} onClick={() => setCursor(new Date(year, month - 1, 1))} />
        <Caption1>{firstDay.toLocaleString('default', { month: 'long', year: 'numeric' })}</Caption1>
        <Button appearance="subtle" icon={<ChevronRightRegular />} onClick={() => setCursor(new Date(year, month + 1, 1))} />
      </div>
      <div className={styles.grid}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className={styles.dayLabel}>
            {d}
          </div>
        ))}
        {cells.map((date, idx) =>
          date ? (
            <div key={idx} className={styles.cell} onClick={() => onDayClick(date)}>
              <Caption1>{date.getDate()}</Caption1>
              {interviewsByDay.has(date.toDateString()) ? (
                <Caption1>
                  <span className={styles.dot} />
                  {interviewsByDay.get(date.toDateString())} interview(s)
                </Caption1>
              ) : null}
            </div>
          ) : (
            <div key={idx} className={`${styles.cell} ${styles.faded}`} />
          )
        )}
      </div>
    </div>
  );
}
