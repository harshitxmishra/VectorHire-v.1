'use client';

import {
  Badge,
  Body1,
  Body1Strong,
  Button,
  Caption1,
  Card,
  Divider,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  MessageBar,
  MessageBarBody,
  OverlayDrawer,
  ProgressBar,
  Skeleton,
  SkeletonItem,
  Tag,
  Text,
  Title2,
  makeStyles,
  tokens,
} from '@fluentui/react-components';

export interface CandidateInsightsDrawerProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  candidateName: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  data?: {
    score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
    interviewQuestions: string[];
  };
}

const useStyles = makeStyles({
  drawerSurface: {
    width: 'min(720px, 100vw)',
    maxWidth: '100vw',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalXL,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  headerBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  sectionTitle: {
    color: tokens.colorNeutralForeground2,
  },
  scoreCard: {
    padding: tokens.spacingVerticalXL,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow8,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  scoreHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalL,
  },
  scoreValue: {
    fontSize: '48px',
    lineHeight: '52px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  progressMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacingVerticalM,
  },
  card: {
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
  },
  questionCard: {
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  questionIndex: {
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalS,
    display: 'block',
  },
  recommendationBar: {
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow4,
  },
  errorBar: {
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow4,
  },
  errorActions: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginTop: tokens.spacingVerticalM,
  },
  skeletonBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
});

function clampScore(score?: number) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, score));
}

function getScoreTone(score: number) {
  if (score >= 80) {
    return {
      color: tokens.colorPaletteGreenForeground1,
      label: 'High confidence',
    };
  }

  if (score >= 60) {
    return {
      color: tokens.colorPaletteDarkOrangeForeground1,
      label: 'Moderate confidence',
    };
  }

  return {
    color: tokens.colorPaletteRedForeground1,
    label: 'Low confidence',
  };
}

function getRecommendationIntent(
  recommendation?: string
): 'success' | 'warning' | 'error' {
  const value = recommendation?.toLowerCase() ?? '';

  if (
    value.includes('strong hire') ||
    value.includes('hire') ||
    value.includes('advance')
  ) {
    return 'success';
  }

  if (
    value.includes('reject') ||
    value.includes('decline') ||
    value.includes('do not')
  ) {
    return 'error';
  }

  return 'warning';
}

function DrawerSectionSkeleton() {
  const styles = useStyles();

  return (
    <Skeleton className={styles.skeletonBlock}>
      <SkeletonItem size={16} />
      <SkeletonItem size={48} />
      <SkeletonItem size={12} />
    </Skeleton>
  );
}

export default function CandidateInsightsDrawer({
  open,
  onClose,
  loading,
  candidateName,
  errorMessage,
  onRetry,
  data,
}: CandidateInsightsDrawerProps) {
  const styles = useStyles();
  const score = clampScore(data?.score);
  const scoreTone = getScoreTone(score);
  const recommendationIntent = getRecommendationIntent(data?.recommendation);

  return (
    <OverlayDrawer
      className={styles.drawerSurface}
      modalType="modal"
      open={open}
      onOpenChange={(_, state) => {
        if (!state.open) {
          onClose();
        }
      }}
      position="end"
      size="large"
    >
      <DrawerHeader>
        <DrawerHeaderTitle>Candidate Intelligence</DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className={styles.body}>
        <div className={styles.headerBlock}>
          {loading ? (
            <Skeleton className={styles.skeletonBlock}>
              <SkeletonItem size={24} />
              <SkeletonItem size={16} />
              <SkeletonItem size={14} />
            </Skeleton>
          ) : (
            <>
              <Title2>{candidateName}</Title2>
              <Body1Strong>Candidate Intelligence Report</Body1Strong>
              <div className={styles.metaRow}>
                <Caption1>Generated by Vector Intelligence Engine</Caption1>
                <Badge appearance="outline" color="informative">
                  Analysis Ready
                </Badge>
              </div>
            </>
          )}
        </div>

        <Divider />

        <section className={styles.section}>
          <Text weight="semibold" className={styles.sectionTitle}>
            Hiring Confidence
          </Text>

          {loading ? (
            <Card className={styles.scoreCard}>
              <DrawerSectionSkeleton />
            </Card>
          ) : (
            <Card className={styles.scoreCard}>
              <div className={styles.scoreHeader}>
                <div>
                  <div
                    className={styles.scoreValue}
                    style={{ color: scoreTone.color }}
                  >
                    {score}%
                  </div>
                  <Caption1>{scoreTone.label}</Caption1>
                </div>

                <Badge appearance="filled" color="informative">
                  AI Score
                </Badge>
              </div>

              <ProgressBar value={score / 100} thickness="large" />

              <div className={styles.progressMeta}>
                <Caption1>Confidence index</Caption1>
                <Caption1>{score}/100</Caption1>
              </div>
            </Card>
          )}
        </section>

        <section className={styles.section}>
          <Text weight="semibold" className={styles.sectionTitle}>
            Executive Summary
          </Text>

          {loading ? (
            <Card className={styles.card}>
              <DrawerSectionSkeleton />
            </Card>
          ) : (
            <Card className={styles.card}>
              <Body1>{data?.summary ?? 'No summary available.'}</Body1>
            </Card>
          )}
        </section>

        <section className={styles.section}>
          <Text weight="semibold" className={styles.sectionTitle}>
            Core Strengths
          </Text>

          {loading ? (
            <Card className={styles.card}>
              <DrawerSectionSkeleton />
            </Card>
          ) : (
            <Card className={styles.card}>
              <div className={styles.tagRow}>
                {(data?.strengths?.length ? data.strengths : ['No strengths identified']).map(
                  (strength) => (
                    <Tag key={strength} appearance="filled" color="success">
                      {strength}
                    </Tag>
                  )
                )}
              </div>
            </Card>
          )}
        </section>

        <section className={styles.section}>
          <Text weight="semibold" className={styles.sectionTitle}>
            Risk Indicators
          </Text>

          {loading ? (
            <Card className={styles.card}>
              <DrawerSectionSkeleton />
            </Card>
          ) : (
            <Card className={styles.card}>
              <div className={styles.tagRow}>
                {(data?.weaknesses?.length
                  ? data.weaknesses
                  : ['No major risks identified']).map((weakness) => (
                  <Tag key={weakness} appearance="filled" color="danger">
                    {weakness}
                  </Tag>
                ))}
              </div>
            </Card>
          )}
        </section>

        <section className={styles.section}>
          <Text weight="semibold" className={styles.sectionTitle}>
            Suggested Interview Focus
          </Text>

          {loading ? (
            <>
              <Card className={styles.questionCard}>
                <DrawerSectionSkeleton />
              </Card>
              <Card className={styles.questionCard}>
                <DrawerSectionSkeleton />
              </Card>
              <Card className={styles.questionCard}>
                <DrawerSectionSkeleton />
              </Card>
            </>
          ) : (
            (data?.interviewQuestions?.length
              ? data.interviewQuestions
              : ['No interview focus areas available.']
            ).map((question, index) => (
              <Card key={`${index}-${question}`} className={styles.questionCard}>
                <Caption1 className={styles.questionIndex}>
                  Interview Focus {index + 1}
                </Caption1>
                <Body1>{question}</Body1>
              </Card>
            ))
          )}
        </section>

        <section className={styles.section}>
          <Text weight="semibold" className={styles.sectionTitle}>
            Recommendation
          </Text>

          {loading ? (
            <Card className={styles.card}>
              <DrawerSectionSkeleton />
            </Card>
          ) : errorMessage ? (
            <MessageBar intent="error" className={styles.errorBar}>
              <MessageBarBody>
                <Body1Strong>Unable to generate report</Body1Strong>
                <Body1>{errorMessage}</Body1>
                {onRetry ? (
                  <div className={styles.errorActions}>
                    <Button appearance="secondary" onClick={onRetry}>
                      Retry
                    </Button>
                  </div>
                ) : null}
              </MessageBarBody>
            </MessageBar>
          ) : (
            <MessageBar intent={recommendationIntent} className={styles.recommendationBar}>
              <MessageBarBody>
                <Body1Strong>{data?.recommendation ?? 'No recommendation available.'}</Body1Strong>
              </MessageBarBody>
            </MessageBar>
          )}
        </section>
      </DrawerBody>
    </OverlayDrawer>
  );
}
