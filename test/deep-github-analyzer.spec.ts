import { describe, it, expect } from 'vitest';
import {
  extractUsername,
  gradeReadme,
  analyzeCommitQuality,
  computeEngineeringSignalScore,
  GhRepo,
} from '@/lib/services/github-service';
import { DeepRepoAnalysis } from '@/lib/types';

describe('Deep GitHub Intelligence Analyzer Tool', () => {
  describe('Username Extraction', () => {
    it('extracts usernames from diverse GitHub URL formats and raw strings', () => {
      expect(extractUsername('https://github.com/torvalds')).toBe('torvalds');
      expect(extractUsername('http://github.com/octocat/')).toBe('octocat');
      expect(extractUsername('github.com/harshitxmishra')).toBe('harshitxmishra');
      expect(extractUsername('developer123')).toBe('developer123');
      expect(extractUsername('invalid username with spaces')).toBe(null);
      expect(extractUsername('https://google.com/notgithub')).toBe(null);
    });
  });

  describe('README Grading for Production Depth', () => {
    it('awards high score for comprehensive README with architecture, setup, and live demo', () => {
      const readme = `# VectorHire Engine
A high-throughput applicant tracking platform.

## Architecture
Modular microservice design with NestJS backend, Redis BullMQ queues, and PostgreSQL vector store.
The data flow uses event-driven worker pipelines.

## Installation & Setup
\`\`\`bash
npm install
docker-compose up -d
npm test
\`\`\`

## Live Demo
Check out the production deployment at https://vector-hire-v-1.vercel.app

## API Specification
Includes OpenAPI Swagger endpoints and full unit test coverage.`;

      const result = gradeReadme(readme);
      expect(result.score).toBeGreaterThanOrEqual(18);
      expect(result.signals).toContain('Detailed architecture & system design documented');
      expect(result.signals).toContain('Clear setup & build instructions');
      expect(result.signals).toContain('Live interactive deployment or demo link provided');
    });

    it('assigns baseline score for sparse or empty README files', () => {
      const emptyResult = gradeReadme('');
      expect(emptyResult.score).toBeLessThanOrEqual(5);

      const minimalResult = gradeReadme('# Project\nHello world.');
      expect(minimalResult.score).toBeLessThanOrEqual(5);
    });
  });

  describe('Commit Quality & Hygiene Analysis', () => {
    it('rewards conventional commits and long-term consistency over 6-12 months', () => {
      const now = Date.now();
      const commits = [
        { message: 'feat(api): implement structured interview meeting link generator', date: new Date(now - 10 * 86400000).toISOString() },
        { message: 'fix(worker): handle BullMQ redis reconnection retry backoff', date: new Date(now - 30 * 86400000).toISOString() },
        { message: 'test(ai): add comprehensive test suite for scorecard generation', date: new Date(now - 60 * 86400000).toISOString() },
        { message: 'refactor(db): optimize pgvector cosine similarity lookup query', date: new Date(now - 120 * 86400000).toISOString() },
        { message: 'ci(actions): add automated Terraform validation workflow step', date: new Date(now - 200 * 86400000).toISOString() },
      ];

      const result = analyzeCommitQuality(commits);
      expect(result.hygieneRatio).toBe(100);
      expect(result.consistencyScore).toBeGreaterThanOrEqual(16);
      expect(result.recentCount).toBe(4);
    });

    it('penalizes low-effort commit messages and sporadic inactivity', () => {
      const lowEffortCommits = [
        { message: 'update', date: new Date(Date.now() - 400 * 86400000).toISOString() },
        { message: 'fix', date: new Date(Date.now() - 401 * 86400000).toISOString() },
        { message: 'test', date: new Date(Date.now() - 402 * 86400000).toISOString() },
      ];

      const result = analyzeCommitQuality(lowEffortCommits);
      expect(result.hygieneRatio).toBe(0);
      expect(result.consistencyScore).toBeLessThan(10);
      expect(result.recentCount).toBe(0);
    });
  });

  describe('5-Part Engineering Signal Score (0-100)', () => {
    it('computes well-balanced sub-scores and overall score', () => {
      const ownRepos: GhRepo[] = [
        {
          name: 'vectorhire-backend',
          description: 'Production NestJS API with Docker and Redis',
          language: 'TypeScript',
          stargazers_count: 12,
          forks_count: 3,
          updated_at: new Date().toISOString(),
          created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
          fork: false,
        },
        {
          name: 'data-pipeline',
          description: 'Python Spark ingestion pipeline with automated tests',
          language: 'Python',
          stargazers_count: 8,
          forks_count: 1,
          updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
          created_at: new Date(Date.now() - 150 * 86400000).toISOString(),
          fork: false,
        },
      ];

      const repoAnalyses: DeepRepoAnalysis[] = [
        {
          name: 'vectorhire-backend',
          isFork: false,
          language: 'TypeScript',
          stars: 12,
          hasReadme: true,
          readmeScore: 18,
          hasTests: true,
          hasDockerfile: true,
          hasCi: true,
          recentCommitCount: 10,
          commitHygieneRatio: 90,
        },
      ];

      const { score, subScores } = computeEngineeringSignalScore({
        ownRepos,
        totalPublicRepos: 2,
        repoAnalyses,
        totalStars: 20,
      });

      expect(score).toBeGreaterThanOrEqual(70);
      expect(subScores.codeDepth).toBeGreaterThanOrEqual(15);
      expect(subScores.commitConsistency).toBeGreaterThanOrEqual(15);
      expect(subScores.readmeQuality).toBeGreaterThanOrEqual(15);
      expect(subScores.repoOriginality).toBeGreaterThanOrEqual(15);
      expect(subScores.stackAlignment).toBeGreaterThanOrEqual(15);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
