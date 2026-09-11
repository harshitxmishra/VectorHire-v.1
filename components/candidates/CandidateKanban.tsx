'use client';

import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Badge,
  Button,
  Avatar,
  Body2,
  Caption1,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
} from '@fluentui/react-components';
import {
  Sparkle16Regular,
  MoreHorizontal20Regular,
  Code16Regular,
  ArrowSyncRegular,
} from '@fluentui/react-icons';
import { Candidate, PIPELINE_STAGES, JobMatchResult } from '@/lib/types';

const useStyles = makeStyles({
  board: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    overflowX: 'auto',
    paddingBottom: tokens.spacingVerticalL,
    minHeight: '520px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '280px',
    maxWidth: '280px',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(12px)',
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.12)'),
    padding: tokens.spacingVerticalM,
    gap: tokens.spacingVerticalM,
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
  },
  columnTitle: {
    fontWeight: 700,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  columnCount: {
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    paddingTop: '2px',
    paddingBottom: '2px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    fontSize: tokens.fontSizeBase100,
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    flex: 1,
    overflowY: 'auto',
    maxHeight: '620px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', 'rgba(148, 163, 184, 0.15)'),
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
    transition: `all ${tokens.durationFast} ${tokens.curveEasyEase}`,
    ':hover': {
      backgroundColor: 'rgba(39, 54, 78, 0.9)',
      ...shorthands.borderColor('rgba(129, 140, 248, 0.4)'),
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 12px -2px rgba(0, 0, 0, 0.35)',
    },
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  candidateName: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardMeta: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.spacingVerticalXS,
    paddingTop: tokens.spacingVerticalXS,
    borderTop: `1px solid rgba(148, 163, 184, 0.1)`,
  },
  scoreBadge: {
    fontWeight: 700,
  },
  emptyColumn: {
    padding: tokens.spacingVerticalXL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground4,
    fontSize: tokens.fontSizeBase200,
    ...shorthands.border('1px', 'dashed', 'rgba(148, 163, 184, 0.1)'),
    borderRadius: tokens.borderRadiusMedium,
  },
});

interface CandidateKanbanProps {
  candidates: Candidate[];
  matches?: Record<number, JobMatchResult>;
  onStatusChange: (candidate: Candidate, newStatus: string) => void;
  onViewAnalysis: (candidate: Candidate) => void;
}

const STAGES: string[] = [
  'Applied',
  'Pending',
  'Shortlisted',
  'Interview Scheduled',
  'Offer Sent',
  'Hired',
  'Rejected',
];

export function CandidateKanban({
  candidates,
  matches = {},
  onStatusChange,
  onViewAnalysis,
}: CandidateKanbanProps) {
  const styles = useStyles();

  const getStageColor = (score: number) => {
    if (score >= 85) return '#22c55e';
    if (score >= 70) return '#eab308';
    return '#94a3b8';
  };

  return (
    <div className={styles.board}>
      {STAGES.map((stage) => {
        const stageCandidates = candidates.filter(
          (c) => (c.status || 'Applied').toLowerCase() === stage.toLowerCase()
        );

        return (
          <div key={stage} className={styles.column}>
            <div className={styles.columnHeader}>
              <span className={styles.columnTitle}>{stage}</span>
              <span className={styles.columnCount}>{stageCandidates.length}</span>
            </div>

            <div className={styles.cardList}>
              {stageCandidates.length === 0 ? (
                <div className={styles.emptyColumn}>No candidates</div>
              ) : (
                stageCandidates.map((candidate) => {
                  const match = matches[candidate.id];

                  return (
                    <div key={candidate.id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, overflow: 'hidden' }}>
                          <Avatar name={candidate.full_name} size={28} color="brand" />
                          <div style={{ overflow: 'hidden' }}>
                            <div className={styles.candidateName}>{candidate.full_name}</div>
                            <div className={styles.cardMeta}>{candidate.college}</div>
                          </div>
                        </div>

                        <Menu>
                          <MenuTrigger disableButtonEnhancement>
                            <Button
                              appearance="transparent"
                              size="small"
                              icon={<MoreHorizontal20Regular />}
                            />
                          </MenuTrigger>
                          <MenuPopover>
                            <MenuList>
                              <MenuItem
                                icon={<Sparkle16Regular />}
                                onClick={() => onViewAnalysis(candidate)}
                              >
                                View AI Analysis
                              </MenuItem>
                              {PIPELINE_STAGES.filter((s) => s.toLowerCase() !== (candidate.status || '').toLowerCase()).map((nextStage) => (
                                <MenuItem
                                  key={nextStage}
                                  icon={<ArrowSyncRegular />}
                                  onClick={() => onStatusChange(candidate, nextStage)}
                                >
                                  Move to {nextStage}
                                </MenuItem>
                              ))}
                            </MenuList>
                          </MenuPopover>
                        </Menu>
                      </div>

                      <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS, flexWrap: 'wrap' }}>
                        <Badge
                          appearance="tint"
                          style={{
                            color: getStageColor(candidate.ai_score),
                            fontWeight: 700,
                          }}
                        >
                          AI: {candidate.ai_score}%
                        </Badge>

                        {match ? (
                          <Badge appearance="tint" color="informative">
                            JD: {match.match_percentage}%
                          </Badge>
                        ) : null}

                        {candidate.cgpa ? (
                          <Badge appearance="tint">
                            CGPA {candidate.cgpa}
                          </Badge>
                        ) : null}

                        {candidate.github ? (
                          <Badge appearance="tint" color="brand" icon={<Code16Regular />}>
                            GitHub
                          </Badge>
                        ) : null}
                      </div>

                      <div className={styles.cardFooter}>
                        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                          {candidate.email}
                        </Caption1>
                        <Button
                          appearance="subtle"
                          size="small"
                          icon={<Sparkle16Regular />}
                          onClick={() => onViewAnalysis(candidate)}
                        >
                          Insights
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
