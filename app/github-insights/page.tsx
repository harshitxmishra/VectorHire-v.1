'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Title2 } from '@fluentui/react-components';
import { EmptyState } from '@/components/ui/empty-state';
import { Notebook24Regular } from '@fluentui/react-icons';

export default function GitHubInsightsPage() {
  return (
    <MainLayout>
      <Title2>GitHub Insights</Title2>
      <EmptyState
        icon={<Notebook24Regular />}
        title="GitHub Integration Coming Soon"
        description="Analyze candidate repositories and contribution patterns. Connect GitHub to get started."
      />
    </MainLayout>
  );
}
