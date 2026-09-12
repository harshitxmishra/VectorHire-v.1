import {
  Injectable,
  BadGatewayException,
} from '@nestjs/common';
import { supabase } from '@/lib/supabase/client';
import {
  getOrAnalyzeGitHub,
  fetchGitHubAnalysis,
} from '@/lib/services/github-service';
import { GitHubIntelligence } from '@/lib/types';
import { logTimelineEvent } from '@/lib/services/timeline-service';
import { friendlyAIErrorMessage } from '@/lib/ai/error';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class GithubService {
  async getCachedAnalysis(candidateId: number): Promise<GitHubIntelligence | null> {
    const { data: candidate } = await supabase
      .from('candidates')
      .select(
        'github, github_score, github_summary, github_languages, github_portfolio_verdict, github_highlights, github_strongest_repo, github_last_analyzed'
      )
      .eq('id', candidateId)
      .single();

    if (!candidate || !candidate.github || candidate.github_score === null) {
      return null;
    }

    const isFresh =
      candidate.github_last_analyzed &&
      Date.now() - new Date(candidate.github_last_analyzed).getTime() < CACHE_TTL_MS;

    if (isFresh) {
      return {
        score: candidate.github_score,
        summary: candidate.github_summary ?? '',
        languages: candidate.github_languages ?? [],
        portfolioVerdict: candidate.github_portfolio_verdict ?? '',
        highlights: candidate.github_highlights ?? [],
        strongestRepo: candidate.github_strongest_repo,
      };
    }

    return null;
  }

  async analyzeCandidate(candidateId: number, force = false): Promise<GitHubIntelligence> {
    try {
      const analysis = await getOrAnalyzeGitHub(candidateId, force);
      await logTimelineEvent(
        candidateId,
        'github_analyzed',
        `Score: ${analysis.score}`,
      );
      return analysis;
    } catch (error) {
      console.error('GitHub analysis failed:', error);
      throw new BadGatewayException(friendlyAIErrorMessage(error));
    }
  }

  async searchUrl(url: string): Promise<GitHubIntelligence> {
    try {
      return await fetchGitHubAnalysis(url);
    } catch (error) {
      console.error('GitHub search failed:', error);
      throw new BadGatewayException(friendlyAIErrorMessage(error));
    }
  }
}
