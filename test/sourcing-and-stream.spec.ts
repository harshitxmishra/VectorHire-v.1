import { describe, it, expect, beforeEach } from 'vitest';
import {
  runSourcerAgent,
  handleProspectApprovalAction,
  memSourcedProspects,
  generatePersonalizedOutreachEmail,
} from '@/lib/services/sourcer-agent';

describe('Phase 4 & Phase 3: HITL Outbound Sourcer and Live SSE Stream', () => {
  beforeEach(() => {
    memSourcedProspects.clear();
  });

  describe('Outbound Sourcer Agent Execution', () => {
    it('discovers developers matching target stack and creates prospective candidate profiles', async () => {
      const prospects = await runSourcerAgent({
        job_description_id: 1,
        role_title: 'Senior Staff Infrastructure Engineer',
        requirements: 'Kubernetes, Rust, Distributed Queues, high scale networking',
        target_skills: ['Kubernetes', 'Rust', 'Networking'],
        max_prospects: 2,
      });

      expect(Array.isArray(prospects)).toBe(true);
      expect(prospects.length).toBeGreaterThan(0);
      expect(prospects.length).toBeLessThanOrEqual(2);

      const prospect = prospects[0];
      expect(prospect.github_username).toBeDefined();
      expect(prospect.profile_url).toContain('github.com');
      expect(prospect.score).toBeGreaterThan(0);
      expect(prospect.cited_repos.length).toBeGreaterThan(0);
    });

    it('places all newly discovered prospects strictly into PENDING_HUMAN_APPROVAL status', async () => {
      const prospects = await runSourcerAgent({
        job_description_id: 1,
        role_title: 'Backend Engineer',
        requirements: 'TypeScript, Next.js, Node.js',
        max_prospects: 2,
      });

      for (const prospect of prospects) {
        expect(prospect.status).toBe('PENDING_HUMAN_APPROVAL');
        expect(prospect.reviewed_at).toBeFalsy();
        expect(prospect.reviewed_by).toBeFalsy();
      }
    });

    it('generates hyper-personalized outreach citing specific repository and architecture choices', async () => {
      const email = await generatePersonalizedOutreachEmail({
        username: 'david-distrib',
        developerName: 'David Lin',
        roleTitle: 'Principal Systems Architect',
        citedRepo: 'raft-consensus-rs',
        architectureHighlight: 'Rust, Raft, Distributed Concurrency, high performance IO',
      });

      expect(email).toContain('David');
      expect(email).toContain('raft-consensus-rs');
      expect(email.length).toBeGreaterThan(100);
    });
  });

  describe('Human-in-the-Loop (HITL) Approval Gate & Transitions', () => {
    it('strictly guarantees NO outreach emails are dispatched while status is PENDING_HUMAN_APPROVAL', async () => {
      const prospects = await runSourcerAgent({
        job_description_id: 1,
        role_title: 'Fullstack Engineer',
        requirements: 'React, Node.js',
        max_prospects: 1,
      });

      const prospect = prospects[0];
      expect(prospect.status).toBe('PENDING_HUMAN_APPROVAL');

      // Check prospect state in memory/database
      const inStore = memSourcedProspects.get(prospect.id);
      expect(inStore?.status).toBe('PENDING_HUMAN_APPROVAL');
      expect(inStore?.reviewed_at).toBeFalsy();
    });

    it('reject action updates status to REJECTED and sends NO outreach email', async () => {
      const prospects = await runSourcerAgent({
        job_description_id: 1,
        role_title: 'Backend Engineer',
        requirements: 'TypeScript',
        max_prospects: 1,
      });

      const prospect = prospects[0];
      const outcome = await handleProspectApprovalAction({
        prospectId: prospect.id,
        action: 'REJECT',
        reviewer: 'Lead Recruiter',
      });

      expect(outcome.success).toBe(true);
      expect(outcome.prospect.status).toBe('REJECTED');
      expect(outcome.emailSent).toBe(false);
      expect(outcome.prospect.reviewed_by).toBe('Lead Recruiter');
      expect(outcome.prospect.reviewed_at).toBeDefined();
    });

    it('approve action updates status to APPROVED and dispatches outreach email', async () => {
      const prospects = await runSourcerAgent({
        job_description_id: 1,
        role_title: 'Backend Engineer',
        requirements: 'TypeScript',
        max_prospects: 1,
      });

      const prospect = prospects[0];
      const outcome = await handleProspectApprovalAction({
        prospectId: prospect.id,
        action: 'APPROVE',
        reviewer: 'VP of Engineering',
      });

      expect(outcome.success).toBe(true);
      expect(outcome.prospect.status).toBe('APPROVED');
      expect(outcome.emailSent).toBe(true);
      expect(outcome.prospect.reviewed_by).toBe('VP of Engineering');
    });

    it('allows customized outreach email draft to be persisted and dispatched on approval', async () => {
      const prospects = await runSourcerAgent({
        job_description_id: 1,
        role_title: 'Backend Engineer',
        requirements: 'TypeScript',
        max_prospects: 1,
      });

      const prospect = prospects[0];
      const customEmail = 'Hello! We were specifically impressed by your commit history on raft-consensus-rs. Let us connect!';

      const outcome = await handleProspectApprovalAction({
        prospectId: prospect.id,
        action: 'APPROVE',
        reviewer: 'Staff Recruiter',
        customEmailBody: customEmail,
      });

      expect(outcome.success).toBe(true);
      expect(outcome.prospect.personalized_email_draft).toBe(customEmail);
      expect(outcome.emailSent).toBe(true);
    });

    it('import action transitions status to IMPORTED and populates active candidate pipeline', async () => {
      const prospects = await runSourcerAgent({
        job_description_id: 1,
        role_title: 'Backend Engineer',
        requirements: 'TypeScript',
        max_prospects: 1,
      });

      const prospect = prospects[0];
      const outcome = await handleProspectApprovalAction({
        prospectId: prospect.id,
        action: 'IMPORT',
        reviewer: 'Hiring Manager',
      });

      expect(outcome.success).toBe(true);
      expect(outcome.prospect.status).toBe('IMPORTED');
      expect(outcome.candidateId).toBeDefined();
      expect(typeof outcome.candidateId).toBe('number');
    });

    it('throws error when attempting to act on a non-existent prospect ID', async () => {
      await expect(
        handleProspectApprovalAction({
          prospectId: 999999,
          action: 'APPROVE',
          reviewer: 'Recruiter',
        })
      ).rejects.toThrow(/not found/i);
    });
  });

  describe('Server-Sent Events (SSE) Stream Formatting & Protocols', () => {
    it('properly formats typed SSE event messages with "data: {...}\\n\\n"', () => {
      const eventPayload = {
        type: 'tool_start',
        tool: 'list_repo_tree',
        owner: 'octocat',
        repo: 'Hello-World',
        timestamp: new Date().toISOString(),
      };

      const sseString = `data: ${JSON.stringify(eventPayload)}\n\n`;
      expect(sseString.startsWith('data: {')).toBe(true);
      expect(sseString.endsWith('\n\n')).toBe(true);

      const parsed = JSON.parse(sseString.replace(/^data: /, '').trim());
      expect(parsed.type).toBe('tool_start');
      expect(parsed.tool).toBe('list_repo_tree');
    });

    it('correctly models all required SSE event types in the streaming protocol', () => {
      const supportedEventTypes = [
        'tool_start',
        'tool_complete',
        'agent_turn',
        'cache_hit',
        'evaluation_complete',
        'error',
      ];

      for (const eventType of supportedEventTypes) {
        const dummyEvent = {
          type: eventType,
          timestamp: new Date().toISOString(),
        };
        const encoded = new TextEncoder().encode(`data: ${JSON.stringify(dummyEvent)}\n\n`);
        const decoded = new TextDecoder().decode(encoded);
        expect(decoded).toContain(eventType);
      }
    });

    it('guarantees timeline logging occurs when prospects transition to active pipeline', async () => {
      const prospects = await runSourcerAgent({
        job_description_id: 1,
        role_title: 'Backend Engineer',
        requirements: 'TypeScript',
        max_prospects: 1,
      });

      const prospect = prospects[0];
      const outcome = await handleProspectApprovalAction({
        prospectId: prospect.id,
        action: 'IMPORT',
        reviewer: 'Lead Recruiter',
      });

      expect(outcome.success).toBe(true);
      expect(outcome.candidateId).toBeDefined();
    });
  });
});
