import {
  Injectable,
  BadGatewayException,
} from '@nestjs/common';
import {
  getOrAnalyzeGitHub,
  fetchGitHubAnalysis,
  GitHubAnalysis,
} from '@/lib/services/github-service';
import { logTimelineEvent } from '@/lib/services/timeline-service';
import { friendlyAIErrorMessage } from '@/lib/ai/error';

@Injectable()
export class GithubService {
  async analyzeCandidate(candidateId: number): Promise<GitHubAnalysis> {
    try {
      const analysis = await getOrAnalyzeGitHub(candidateId);
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

  async searchUrl(url: string): Promise<GitHubAnalysis> {
    try {
      return await fetchGitHubAnalysis(url);
    } catch (error) {
      console.error('GitHub search failed:', error);
      throw new BadGatewayException(friendlyAIErrorMessage(error));
    }
  }
}
