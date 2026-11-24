import { describe, it, expect } from 'vitest';
import {
  isIgnoredPath,
  list_repo_tree,
  read_file_chunk,
  get_recent_prs,
  check_test_coverage,
  runRepoInterrogation,
} from '@/lib/services/repo-interrogator';

describe('Phase 1: Code-Level Repo Interrogation ReAct Agent', () => {
  describe('Tool 1: list_repo_tree and isIgnoredPath', () => {
    it('accurately identifies and ignores lockfiles, node_modules, and build artifacts', () => {
      expect(isIgnoredPath('node_modules/express/index.js')).toBe(true);
      expect(isIgnoredPath('package-lock.json')).toBe(true);
      expect(isIgnoredPath('pnpm-lock.yaml')).toBe(true);
      expect(isIgnoredPath('yarn.lock')).toBe(true);
      expect(isIgnoredPath('dist/bundle.js')).toBe(true);
      expect(isIgnoredPath('.next/server/page.js')).toBe(true);
      expect(isIgnoredPath('.git/objects/0a/1234')).toBe(true);
      expect(isIgnoredPath('assets/logo.png')).toBe(true);

      // Legitimate source files should NOT be ignored
      expect(isIgnoredPath('src/api/routes.ts')).toBe(false);
      expect(isIgnoredPath('backend/worker.ts')).toBe(false);
      expect(isIgnoredPath('lib/services/auth.service.ts')).toBe(false);
    });

    it('returns a filtered repository tree omitting ignored files', async () => {
      const tree = await list_repo_tree('octocat', 'Hello-World');
      expect(Array.isArray(tree)).toBe(true);
      expect(tree.length).toBeGreaterThan(0);
      for (const item of tree) {
        expect(isIgnoredPath(item.path)).toBe(false);
      }
    });
  });

  describe('Tool 2: read_file_chunk with strict line budget bounds', () => {
    it('caps chunk reading to maximum 150 lines per call to preserve token budget', async () => {
      const chunk = await read_file_chunk('octocat', 'Spoon-Knife', 'src/queue/worker.ts', 1, 500);
      const lines = chunk.content.split('\n');
      expect(lines.length).toBeLessThanOrEqual(150);
      expect(chunk.startLine).toBe(1);
      expect(chunk.endLine).toBeLessThanOrEqual(150);
    });

    it('handles custom startLine and endLine sub-slices accurately', async () => {
      const chunk = await read_file_chunk('octocat', 'Spoon-Knife', 'src/auth/jwt.ts', 1, 15);
      expect(chunk.startLine).toBe(1);
      expect(chunk.endLine).toBe(15);
      const lines = chunk.content.split('\n');
      expect(lines.length).toBe(15);
    });
  });

  describe('Tool 3: get_recent_prs inspection', () => {
    it('fetches recent merged PRs with titles, bodies, and review comment counts', async () => {
      const prs = await get_recent_prs('octocat', 'Spoon-Knife');
      expect(Array.isArray(prs)).toBe(true);
      expect(prs.length).toBeGreaterThan(0);
      const first = prs[0];
      expect(first).toHaveProperty('number');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('comments_count');
    });
  });

  describe('Tool 4: check_test_coverage and CI detection', () => {
    it('identifies test frameworks, CI workflows, and calculates test-to-source ratio', async () => {
      const coverage = await check_test_coverage('octocat', 'Spoon-Knife');
      expect(coverage).toHaveProperty('frameworks');
      expect(coverage).toHaveProperty('ci_workflows');
      expect(coverage).toHaveProperty('test_ratio');
      expect(typeof coverage.test_ratio).toBe('number');
      expect(coverage.test_ratio).toBeGreaterThan(0);
      expect(coverage.frameworks.length).toBeGreaterThan(0);
    });
  });

  describe('ReAct Loop Bounds & Line-Specific Question Extraction', () => {
    it('runs bounded ReAct loop within maximum 5 tool iterations', async () => {
      const result = await runRepoInterrogation({
        githubUrl: 'https://github.com/test-developer/high-scale-queue',
        strongestRepo: 'high-scale-queue',
        force: true,
      });

      expect(result).toBeDefined();
      expect(result.tool_traces).toBeDefined();
      expect(result.tool_traces.length).toBeLessThanOrEqual(5);
      for (const trace of result.tool_traces) {
        expect(['list_repo_tree', 'read_file_chunk', 'get_recent_prs', 'check_test_coverage']).toContain(
          trace.tool
        );
        expect(trace.latency_ms).toBeGreaterThanOrEqual(0);
      }
    });

    it('selects candidate architecturally significant source files and assigns quality scores', async () => {
      const result = await runRepoInterrogation({
        githubUrl: 'https://github.com/test-developer/vectorhire-backend',
        strongestRepo: 'vectorhire-backend',
        force: true,
      });

      expect(result.inspected_files.length).toBeGreaterThanOrEqual(1);
      for (const file of result.inspected_files) {
        expect(file.repo).toBe('vectorhire-backend');
        expect(file.path).toBeDefined();
        expect(file.lines).toBeDefined();
        expect(file.architectural_notes).toBeDefined();
        expect(typeof file.code_quality_score).toBe('number');
        expect(file.code_quality_score).toBeGreaterThanOrEqual(0);
        expect(file.code_quality_score).toBeLessThanOrEqual(100);
      }
    });

    it('generates line-specific technical interview questions citing exact file paths and line ranges', async () => {
      const result = await runRepoInterrogation({
        githubUrl: 'https://github.com/test-developer/vectorhire-backend',
        strongestRepo: 'vectorhire-backend',
        force: true,
      });

      expect(result.line_specific_interview_questions.length).toBeGreaterThanOrEqual(2);
      for (const q of result.line_specific_interview_questions) {
        expect(q.repo).toBe('vectorhire-backend');
        expect(q.path).toBeDefined();
        expect(q.line_range).toMatch(/L\d+/);
        expect(q.question.length).toBeGreaterThan(15);
      }
    });

    it('gracefully falls back on simulated rate-limiting without throwing unhandled exceptions', async () => {
      const result = await runRepoInterrogation({
        githubUrl: 'https://github.com/rate-limited-user/some-repo',
        strongestRepo: 'some-repo',
        force: true,
      });

      expect(result).toBeDefined();
      expect(result.inspected_files).toBeDefined();
      expect(result.line_specific_interview_questions).toBeDefined();
    });
  });
});
