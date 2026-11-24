import { supabase } from '@/lib/supabase/client';
import { runHiringCommittee } from '@/lib/services/hiring-committee';
import { computeContentHash, getCachedAIEvaluation } from '@/lib/services/cache-service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(context.params);
  const candidateId = Number(resolvedParams.id);

  if (!Number.isFinite(candidateId) || candidateId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid candidate ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (event: string, data: any) => {
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(payload));
    } catch {
      // Stream client might have disconnected
    }
  };

  (async () => {
    try {
      // 1. Fetch candidate
      const { data: candidate, error: candError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (candError || !candidate) {
        await sendEvent('error', { message: 'Candidate not found.' });
        return;
      }

      // 2. Check cache if not force
      const contentHash = computeContentHash({
        candidate_id: candidate.id,
        full_name: candidate.full_name,
        college: candidate.college,
        cgpa: candidate.cgpa,
        github: candidate.github,
        status: candidate.status,
      });

      if (!force) {
        const cached = await getCachedAIEvaluation(contentHash);
        if (cached && (cached as any).verdict && (cached as any).debate_transcript) {
          await sendEvent('cache_hit', {
            cached: true,
            content_hash: contentHash,
            verdict: (cached as any).verdict,
            score: (cached as any).score,
          });

          // Instant replay of tool traces and turns
          if (Array.isArray((cached as any).tool_traces)) {
            for (const t of (cached as any).tool_traces) {
              await sendEvent('tool_complete', {
                tool: t.tool,
                latency_ms: t.latency_ms || 10,
                summary: t.output_summary,
                timestamp: t.timestamp || new Date().toISOString(),
                cache_hit: true,
              });
            }
          }

          if (Array.isArray((cached as any).debate_transcript)) {
            for (const turn of (cached as any).debate_transcript) {
              await sendEvent('agent_turn', turn);
            }
          }

          await sendEvent('evaluation_complete', {
            evaluation: cached,
            verdict: (cached as any).verdict,
            score: (cached as any).score,
            cached: true,
          });
          return;
        }
      }

      // 3. Run fresh live execution with SSE event notifications
      const evaluation = await runHiringCommittee({
        candidate_id: candidate.id,
        full_name: candidate.full_name,
        college: candidate.college,
        cgpa: candidate.cgpa,
        github: candidate.github,
        status: candidate.status,
        resume_text: candidate.resume_text,
        best_ai_project: candidate.best_ai_project,
        research_work: candidate.research_work,
        force,
        onTrace: async (trace) => {
          await sendEvent('tool_start', {
            tool: trace.tool,
            input: trace.input,
            timestamp: new Date().toISOString(),
          });
          await sendEvent('tool_complete', {
            tool: trace.tool,
            latency_ms: trace.latency_ms,
            summary: trace.output_summary,
            timestamp: trace.timestamp || new Date().toISOString(),
          });
        },
        onTurn: async (turn) => {
          await sendEvent('agent_turn', turn);
        },
      });

      await sendEvent('evaluation_complete', {
        evaluation,
        verdict: evaluation.verdict,
        score: evaluation.score,
        cached: false,
      });
    } catch (err: any) {
      console.error('Agent SSE stream error:', err);
      await sendEvent('error', {
        message: err?.message || 'Agent evaluation streaming failed.',
      });
    } finally {
      try {
        await writer.close();
      } catch {
        // Safe ignore
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  return GET(req, context);
}
