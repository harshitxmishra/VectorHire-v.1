import { supabase } from '@/lib/supabase/client';
import { GitHubIntelligence } from '@/lib/types';
import { aiGenerateJSON } from '@/lib/ai/client';
import { AISchema } from '@/lib/ai/types';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const githubAnalysisSchema: AISchema = {
  type: 'object',
  properties: {
    score: { type: 'number', minimum: 0, maximum: 100 },
    summary: { type: 'string' },
    portfolioVerdict: { type: 'string' },
    highlights: { type: 'array', items: { type: 'string' } },
  },
  required: ['score', 'summary', 'portfolioVerdict', 'highlights'],
};

function extractUsername(url: string): string | null {
  const match = url.match(/github\.com\/([A-Za-z0-9-]+)/i);
  return match?.[1] ?? null;
}

interface GhRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  fork: boolean;
  topics?: string[];
}

async function ghFetch(url: string) {
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) {
    throw new Error(`GitHub API request failed (${res.status}).`);
  }
  return res.json();
}

function categorize(repos: GhRepo[]) {
  const text = repos
    .map((r) => `${r.name} ${r.description ?? ''} ${(r.topics ?? []).join(' ')}`)
    .join(' ')
    .toLowerCase();

  return {
    backend: /express|django|flask|spring|fastapi|node\.?js|nestjs|api/.test(text),
    frontend: /react|vue|angular|next\.?js|frontend|html|css|tailwind/.test(text),
    ai: /machine.learning|tensorflow|pytorch|\bml\b|\bai\b|llm|neural|nlp|opencv/.test(text),
    deployment: /docker|vercel|heroku|kubernetes|ci\/cd|deploy/.test(text),
    database: /postgres|mongo|mysql|sql|redis|supabase|firebase/.test(text),
  };
}

export async function fetchGitHubAnalysis(githubUrl: string): Promise<GitHubIntelligence> {
  const username = extractUsername(githubUrl);
  if (!username) {
    throw new Error('Could not extract a GitHub username from the provided URL.');
  }

  const [user, repos]: [any, GhRepo[]] = await Promise.all([
    ghFetch(`https://api.github.com/users/${username}`),
    ghFetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`),
  ]);

  const ownRepos = (repos ?? []).filter((r) => !r.fork);

  if (ownRepos.length === 0) {
    return {
      score: 20,
      summary: 'GitHub profile exists but has no original public repositories.',
      languages: [],
      portfolioVerdict: 'Portfolio Needs Improvement',
      highlights: [],
      strongestRepo: null,
    };
  }

  const languageCounts: Record<string, number> = {};
  let totalStars = 0;
  let totalForks = 0;
  const now = Date.now();
  const recentlyActive = ownRepos.filter(
    (r) => now - new Date(r.updated_at).getTime() < 1000 * 60 * 60 * 24 * 180
  ).length;
  const withDescription = ownRepos.filter((r) => r.description && r.description.trim().length > 10).length;

  ownRepos.forEach((r) => {
    if (r.language) languageCounts[r.language] = (languageCounts[r.language] ?? 0) + 1;
    totalStars += r.stargazers_count;
    totalForks += r.forks_count;
  });

  const topLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);

  const strongestRepo = [...ownRepos].sort(
    (a, b) => b.stargazers_count - a.stargazers_count
  )[0];

  const flags = categorize(ownRepos);

  const prompt = `You are a technical recruiter assessing a GitHub portfolio for engineering maturity (NOT popularity/stars).

Profile: ${username}, ${ownRepos.length} original repositories, ${user.public_repos} total public repos.
Top languages: ${topLanguages.join(', ') || 'none detected'}.
Recently active repos (last 6 months): ${recentlyActive}/${ownRepos.length}.
Repos with meaningful descriptions: ${withDescription}/${ownRepos.length}.
Total stars: ${totalStars}, total forks: ${totalForks}.
Detected signals: backend=${flags.backend}, frontend=${flags.frontend}, AI/ML=${flags.ai}, deployment=${flags.deployment}, database=${flags.database}.
Strongest repo by stars: ${strongestRepo?.name ?? 'none'} - ${strongestRepo?.description ?? 'no description'}.

Score engineering maturity 0-100 based on project quality, technology diversity, portfolio completeness, and consistency. Do not overvalue stars/followers.
Give a short summary (2-3 sentences), a concise portfolioVerdict (e.g. "Strong Full-Stack Portfolio", "Backend-Focused Engineer", "Mostly Academic Projects", "Portfolio Needs Improvement"), and 2-4 short engineering highlights.`;

  const parsed = await aiGenerateJSON<{
    score: number;
    summary: string;
    portfolioVerdict: string;
    highlights: string[];
  }>({ prompt, schema: githubAnalysisSchema });

  return {
    score: parsed.score,
    summary: parsed.summary,
    languages: topLanguages,
    portfolioVerdict: parsed.portfolioVerdict,
    highlights: parsed.highlights,
    strongestRepo: strongestRepo ? strongestRepo.name : null,
  };
}

export async function getOrAnalyzeGitHub(candidateId: number): Promise<GitHubIntelligence> {
  const { data: candidate, error } = await supabase
    .from('candidates')
    .select(
      'github, github_score, github_summary, github_languages, github_portfolio_verdict, github_highlights, github_strongest_repo, github_last_analyzed'
    )
    .eq('id', candidateId)
    .single();

  if (error) {
    throw new Error(`Failed to load candidate: ${error.message}`);
  }

  if (!candidate) {
    throw new Error('Candidate not found.');
  }

  if (!candidate.github) {
    throw new Error('Candidate has no GitHub profile URL.');
  }

  const isFresh =
    candidate.github_last_analyzed &&
    Date.now() - new Date(candidate.github_last_analyzed).getTime() < CACHE_TTL_MS;

  if (isFresh && candidate.github_score !== null) {
    return {
      score: candidate.github_score,
      summary: candidate.github_summary ?? '',
      languages: candidate.github_languages ?? [],
      portfolioVerdict: candidate.github_portfolio_verdict ?? '',
      highlights: candidate.github_highlights ?? [],
      strongestRepo: candidate.github_strongest_repo,
    };
  }

  const analysis = await fetchGitHubAnalysis(candidate.github);

  await supabase
    .from('candidates')
    .update({
      github_score: analysis.score,
      github_summary: analysis.summary,
      github_languages: analysis.languages,
      github_portfolio_verdict: analysis.portfolioVerdict,
      github_highlights: analysis.highlights,
      github_strongest_repo: analysis.strongestRepo,
      github_last_analyzed: new Date().toISOString(),
    })
    .eq('id', candidateId);

  return analysis;
}
