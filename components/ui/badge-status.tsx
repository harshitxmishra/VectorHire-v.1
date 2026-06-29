'use client';

import { Badge, makeStyles, tokens } from '@fluentui/react-components';
import {
  CheckmarkCircle12Filled,
  Clock12Regular,
  DismissCircle12Filled,
  Eye12Regular,
  Pause12Regular,
  PresenceAvailable12Filled,
  Star12Filled,
} from '@fluentui/react-icons';
import { JSX } from 'react';

const useStyles = makeStyles({
  root: {
    borderRadius: tokens.borderRadiusCircular,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    textTransform: 'capitalize',
  },
});

interface BadgeStatusProps {
  status: string;
}

const statusConfig: Record<
  string,
  {
    color:
      | 'brand'
      | 'danger'
      | 'important'
      | 'informative'
      | 'severe'
      | 'subtle'
      | 'success'
      | 'warning';
    icon: JSX.Element;
    label: string;
  }
> = {
  new: {
    color: 'brand',
    icon: <Star12Filled />,
    label: 'New',
  },
  pending: {
    color: 'warning',
    icon: <Clock12Regular />,
    label: 'Pending',
  },
  Pending: {
    color: 'warning',
    icon: <Clock12Regular />,
    label: 'Pending',
  },
  shortlisted: {
    color: 'success',
    icon: <CheckmarkCircle12Filled />,
    label: 'Shortlisted',
  },
  Shortlisted: {
    color: 'success',
    icon: <CheckmarkCircle12Filled />,
    label: 'Shortlisted',
  },
  rejected: {
    color: 'danger',
    icon: <DismissCircle12Filled />,
    label: 'Rejected',
  },
  Rejected: {
    color: 'danger',
    icon: <DismissCircle12Filled />,
    label: 'Rejected',
  },
  hired: {
    color: 'success',
    icon: <PresenceAvailable12Filled />,
    label: 'Hired',
  },
  Reviewed: {
    color: 'informative',
    icon: <Eye12Regular />,
    label: 'Reviewed',
  },
  Interview: {
    color: 'important',
    icon: <CheckmarkCircle12Filled />,
    label: 'Interview',
  },
  active: {
    color: 'success',
    icon: <CheckmarkCircle12Filled />,
    label: 'Active',
  },
  paused: {
    color: 'warning',
    icon: <Pause12Regular />,
    label: 'Paused',
  },
  closed: {
    color: 'danger',
    icon: <DismissCircle12Filled />,
    label: 'Closed',
  },
};

export function BadgeStatus({ status }: BadgeStatusProps) {
  const styles = useStyles();

  const config = statusConfig[status] ?? {
    color: 'subtle' as const,
    icon: <Clock12Regular />,
    label: status,
  };

  return (
    <Badge
      appearance="tint"
      color={config.color}
      icon={config.icon}
      className={styles.root}
    >
      {config.label}
    </Badge>
  );
}
