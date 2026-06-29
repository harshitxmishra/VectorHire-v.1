import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

export const useResponsiveGrid = makeStyles({
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacingVerticalL,
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
  containerSmall: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingVerticalM,
  },
  containerLarge: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: tokens.spacingVerticalXL,
  },
});

export const useCardStyles = makeStyles({
  root: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalXL,
    transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
    },
  },
  compact: {
    padding: tokens.spacingVerticalL,
  },
  elevated: {
    boxShadow: tokens.shadow4,
  },
});

export const useSkeletonStyles = makeStyles({
  skeleton: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    animationName: {
      '0%, 100%': {
        opacity: 0.6,
      },
      '50%': {
        opacity: 1,
      },
    },
    animationDuration: '1.5s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },
  bar: {
    height: '16px',
    marginTop: tokens.spacingVerticalM,
  },
  circle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
  },
});

export const useFlexStyles = makeStyles({
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowStart: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  columnCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
  },
});

export const statusColorMap = {
  new: tokens.colorBrandBackground,
  pending: tokens.colorStatusWarningBackground1,
  shortlisted: tokens.colorStatusSuccessBackground1,
  rejected: tokens.colorStatusDangerBackground1,
  hired: tokens.colorStatusSuccessBackground1,
  active: tokens.colorStatusSuccessBackground1,
  paused: tokens.colorStatusWarningBackground1,
  closed: tokens.colorStatusDangerBackground1,
};

export const statusForegroundMap = {
  new: tokens.colorBrandForeground1,
  pending: tokens.colorStatusWarningForeground1,
  shortlisted: tokens.colorStatusSuccessForeground1,
  rejected: tokens.colorStatusDangerForeground1,
  hired: tokens.colorStatusSuccessForeground1,
  active: tokens.colorStatusSuccessForeground1,
  paused: tokens.colorStatusWarningForeground1,
  closed: tokens.colorStatusDangerForeground1,
};

export const getScoreColor = (score: number): string => {
  if (score >= 8) return tokens.colorStatusSuccessBackground1;
  if (score >= 7) return tokens.colorStatusSuccessBackground1;
  if (score >= 6) return tokens.colorStatusWarningBackground1;
  return tokens.colorStatusDangerBackground1;
};

export const getScoreForeground = (score: number): string => {
  if (score >= 8) return tokens.colorStatusSuccessForeground1;
  if (score >= 7) return tokens.colorStatusSuccessForeground1;
  if (score >= 6) return tokens.colorStatusWarningForeground1;
  return tokens.colorStatusDangerForeground1;
};
