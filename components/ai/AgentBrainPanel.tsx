'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Badge,
  Button,
  Title3,
  Body1,
  Body2,
  Caption1,
  Spinner,
  TabList,
  Tab,
  makeStyles,
  tokens,
  shorthands,
  Card,
  CardHeader,
  ProgressBar,
} from '@fluentui/react-components';
import {
  SparkleRegular,
  PlayRegular,
  ArrowSyncRegular,
  CodeRegular,
  PeopleTeamRegular,
  DocumentCheckmarkRegular,
  CopyRegular,
  CheckmarkRegular,
  WarningRegular,
  DismissCircleRegular,
  CheckmarkCircleRegular,
  TimerRegular,
  OpenRegular,
  FlashRegular,
} from '@fluentui/react-icons';
import {
  AIEvaluationResult,
  ClaimVerificationItem,
  CommitteeVerdict,
  DebateTurn,
  InspectedFile,
  LineSpecificQuestion,
  ToolExecutionTrace,
} from '@/lib/types';
import { fetchWithAuth } from '@/lib/utils/api-client';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalL,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke3),
  },
  verdictBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    padding: '16px 20px',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
  },
  verdictScore: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  terminalView: {
    backgroundColor: '#0d1117',
    color: '#58a6ff',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '13px',
    borderRadius: tokens.borderRadiusMedium,
    padding: '16px',
    maxHeight: '420px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    ...shorthands.border('1px', 'solid', '#30363d'),
  },
  terminalLine: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    lineHeight: '1.5',
  },
  debateThread: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  agentCard: {
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  advocateCard: {
    borderLeftWidth: '4px',
    borderLeftColor: tokens.colorPaletteGreenBorderActive,
  },
  skepticCard: {
    borderLeftWidth: '4px',
    borderLeftColor: tokens.colorPaletteRedBorderActive,
  },
  managerCard: {
    borderLeftWidth: '4px',
    borderLeftColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  citationList: {
    margin: '4px 0 0 16px',
    padding: 0,
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  prepCard: {
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    ...shorthands.borderBottom('2px', 'solid', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground3,
    fontWeight: 600,
  },
  td: {
    padding: '10px 12px',
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
});

interface AgentBrainPanelProps {
  candidateId: number;
  initialEvaluation?: AIEvaluationResult | null;
  onEvaluationComplete?: (result: AIEvaluationResult) => void;
}

export function AgentBrainPanel({
  candidateId,
  initialEvaluation,
  onEvaluationComplete,
}: AgentBrainPanelProps) {
  const styles = useStyles();

  const [activeSubTab, setActiveSubTab] = useState<'debate' | 'timeline' | 'prep' | 'matrix'>('debate');
  const [running, setRunning] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [traces, setTraces] = useState<ToolExecutionTrace[]>(
    initialEvaluation?.tool_traces || []
  );
  const [debateTurns, setDebateTurns] = useState<DebateTurn[]>(
    initialEvaluation?.debate_transcript || []
  );
  const [evaluation, setEvaluation] = useState<AIEvaluationResult | null>(
    initialEvaluation || null
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [cacheHit, setCacheHit] = useState<boolean>(!!initialEvaluation?.cached);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Sync initial props
  useEffect(() => {
    if (initialEvaluation) {
      setEvaluation(initialEvaluation);
      if (initialEvaluation.tool_traces) setTraces(initialEvaluation.tool_traces);
      if (initialEvaluation.debate_transcript) setDebateTurns(initialEvaluation.debate_transcript);
    }
  }, [initialEvaluation]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [traces, statusMessage]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const runEvaluation = async (force = false) => {
    if (running) return;
    setRunning(true);
    setCacheHit(false);
    setStreamProgress(10);
    setStatusMessage('Initiating autonomous ReAct agent & Hiring Committee...');

    if (force) {
      setTraces([]);
      setDebateTurns([]);
    }

    try {
      const response = await fetchWithAuth(
        `/api/candidates/${candidateId}/evaluate/stream?force=${force}`
      );

      if (!response.ok || !response.body) {
        throw new Error(`Failed to initiate stream (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const eventMatch = block.match(/^event:\s*(\w+)/m);
          const dataMatch = block.match(/^data:\s*(.*)/m);
          if (!eventMatch || !dataMatch) continue;

          const event = eventMatch[1];
          let data: any = {};
          try {
            data = JSON.parse(dataMatch[1]);
          } catch {
            data = { raw: dataMatch[1] };
          }

          if (event === 'cache_hit') {
            setCacheHit(true);
            setStatusMessage(`Instant cache replay verified via SHA-256 (Hash: ${data.content_hash?.slice(0, 12)}...)`);
            setStreamProgress(90);
          } else if (event === 'tool_start') {
            setStatusMessage(`[Tool Executing] ${data.tool}...`);
            setStreamProgress((prev) => Math.min(prev + 12, 60));
          } else if (event === 'tool_complete') {
            setTraces((prev) => [
              ...prev,
              {
                tool: data.tool,
                input: data.input || {},
                output_summary: data.summary,
                latency_ms: data.latency_ms || 25,
                timestamp: data.timestamp,
                cache_hit: data.cache_hit,
              },
            ]);
            setStatusMessage(`[Tool Completed] ${data.tool} (${data.latency_ms || 25}ms)`);
          } else if (event === 'agent_turn') {
            setDebateTurns((prev) => [...prev, data]);
            setStatusMessage(`[Debate Turn] ${data.agent} delivered claim`);
            setStreamProgress((prev) => Math.min(prev + 15, 85));
          } else if (event === 'evaluation_complete') {
            setEvaluation(data.evaluation);
            setStreamProgress(100);
            setStatusMessage(`Evaluation finalized. Verdict: ${data.verdict} (${data.score}/100)`);
            if (onEvaluationComplete) onEvaluationComplete(data.evaluation);
          } else if (event === 'error') {
            setStatusMessage(`Error: ${data.message}`);
          }
        }
      }
    } catch (err: any) {
      setStatusMessage(`Stream error: ${err?.message || 'Connection failed'}`);
    } finally {
      setRunning(false);
    }
  };

  const verdict = evaluation?.verdict || 'LEAN_HIRE';
  const score = evaluation?.calibrated_score ?? evaluation?.score ?? 0;

  const getVerdictBadgeColor = (v?: CommitteeVerdict | string) => {
    switch (v) {
      case 'STRONG_HIRE':
        return 'success';
      case 'LEAN_HIRE':
        return 'informative';
      case 'LEAN_NO_HIRE':
        return 'warning';
      case 'NO_HIRE':
        return 'danger';
      default:
        return 'informative';
    }
  };

  const getMatrixStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED_IN_CODE':
        return (
          <Badge appearance="filled" color="success">
            Verified in Code
          </Badge>
        );
      case 'RESUME_ONLY':
        return (
          <Badge appearance="tint" color="warning">
            Resume Only
          </Badge>
        );
      case 'CONTRADICTED':
        return (
          <Badge appearance="filled" color="danger">
            Contradicted
          </Badge>
        );
      case 'MISSING':
        return (
          <Badge appearance="tint" color="danger">
            Missing
          </Badge>
        );
      default:
        return <Badge appearance="tint">{status}</Badge>;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SparkleRegular style={{ fontSize: '24px', color: tokens.colorBrandForeground1 }} />
          <div>
            <Title3>Autonomous Agent Brain & Hiring Committee</Title3>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              Stateful ReAct Repo Interrogation & Adversarial 3-Agent Consensus
            </Caption1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {cacheHit && (
            <Badge appearance="tint" color="informative" icon={<FlashRegular />}>
              Cached Instant-Replay
            </Badge>
          )}

          <Button
            appearance="primary"
            icon={running ? <Spinner size="extra-tiny" /> : <PlayRegular />}
            disabled={running}
            onClick={() => runEvaluation(false)}
          >
            {running ? 'Agent Running...' : 'Run Live Agent Evaluation'}
          </Button>

          <Button
            appearance="secondary"
            icon={<ArrowSyncRegular />}
            disabled={running}
            onClick={() => runEvaluation(true)}
            title="Force fresh live evaluation bypassing cache"
          >
            Re-Evaluate
          </Button>
        </div>
      </div>

      {/* Progress / Status banner when running */}
      {running && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Caption1 style={{ color: tokens.colorBrandForeground1, fontWeight: 600 }}>
              {statusMessage}
            </Caption1>
            <Caption1>{streamProgress}%</Caption1>
          </div>
          <ProgressBar value={streamProgress / 100} color="brand" />
        </div>
      )}

      {/* Verdict & Score Banner */}
      {evaluation && (
        <div className={styles.verdictBanner}>
          <div className={styles.verdictScore}>
            <Badge
              appearance="filled"
              size="extra-large"
              color={getVerdictBadgeColor(verdict)}
            >
              {verdict.replace('_', ' ')}
            </Badge>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: tokens.colorNeutralForeground1 }}>
                {score} / 100
              </div>
              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                Hiring Committee Calibrated Engineering Score
              </Caption1>
            </div>
          </div>

          <Body2 style={{ maxWidth: '580px', color: tokens.colorNeutralForeground2 }}>
            {evaluation.summary}
          </Body2>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <TabList
        selectedValue={activeSubTab}
        onTabSelect={(_, data) => setActiveSubTab(data.value as typeof activeSubTab)}
      >
        <Tab value="debate" icon={<PeopleTeamRegular />}>
          Hiring Committee Debate ({debateTurns.length})
        </Tab>
        <Tab value="timeline" icon={<CodeRegular />}>
          Live Tool Execution Trace ({traces.length})
        </Tab>
        <Tab value="prep" icon={<DocumentCheckmarkRegular />}>
          Line-Specific Interview Prep ({evaluation?.line_specific_interview_questions?.length || 0})
        </Tab>
        <Tab value="matrix" icon={<CheckmarkCircleRegular />}>
          Claim Verification Matrix ({evaluation?.claim_verification_matrix?.length || 0})
        </Tab>
      </TabList>

      {/* SUB-TAB 1: DEBATE TRANSCRIPT */}
      {activeSubTab === 'debate' && (
        <div className={styles.debateThread}>
          {debateTurns.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
              No committee debate transcript yet. Click &quot;Run Live Agent Evaluation&quot; to convene Advocate, Skeptic, and Hiring Manager.
            </div>
          ) : (
            debateTurns.map((turn, idx) => {
              const isAdvocate = turn.agent === 'ADVOCATE';
              const isSkeptic = turn.agent === 'SKEPTIC';
              const isManager = turn.agent === 'HIRING_MANAGER';

              return (
                <div
                  key={idx}
                  className={`${styles.agentCard} ${
                    isAdvocate
                      ? styles.advocateCard
                      : isSkeptic
                      ? styles.skepticCard
                      : styles.managerCard
                  }`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge
                        appearance="filled"
                        color={isAdvocate ? 'success' : isSkeptic ? 'danger' : 'brand'}
                      >
                        {isAdvocate
                          ? 'Advocate Agent (Engineering Depth)'
                          : isSkeptic
                          ? 'Skeptic Agent (Principal Architect)'
                          : 'Hiring Manager (Synthesizer)'}
                      </Badge>
                    </div>
                    <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                      {turn.timestamp ? new Date(turn.timestamp).toLocaleTimeString() : ''}
                    </Caption1>
                  </div>

                  <Body1 style={{ lineHeight: '1.6', marginTop: '4px' }}>{turn.claim}</Body1>

                  {Array.isArray(turn.evidence_citations) && turn.evidence_citations.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
                        Evidence Citations:
                      </Caption1>
                      <ul className={styles.citationList}>
                        {turn.evidence_citations.map((cite, cIdx) => (
                          <li key={cIdx}>{cite}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB-TAB 2: LIVE TOOL EXECUTION TIMELINE */}
      {activeSubTab === 'timeline' && (
        <div className={styles.terminalView}>
          <div style={{ color: '#8b949e', borderBottom: '1px solid #30363d', paddingBottom: '6px' }}>
            $ VectorHire Agentic ReAct Engine ~ Tool Dispatch & Latency Monitor
          </div>

          {traces.length === 0 ? (
            <div style={{ color: '#8b949e', padding: '16px 0' }}>
              &gt; Ready. Awaiting live execution trigger...
            </div>
          ) : (
            traces.map((trace, idx) => (
              <div key={idx} className={styles.terminalLine}>
                <span style={{ color: '#7ee787' }}>[✓]</span>
                <span style={{ color: '#d2a8ff', fontWeight: 600 }}>{trace.tool}</span>
                <span style={{ color: '#79c0ff' }}>
                  ({trace.latency_ms}ms{trace.cache_hit ? ', cache-hit' : ''}):
                </span>
                <span style={{ color: '#c9d1d9' }}>{trace.output_summary}</span>
              </div>
            ))
          )}

          {statusMessage && (
            <div style={{ color: '#e3b341', fontStyle: 'italic' }}>
              &gt; {statusMessage}
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      )}

      {/* SUB-TAB 3: LINE-SPECIFIC INTERVIEW PREP */}
      {activeSubTab === 'prep' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(!evaluation?.line_specific_interview_questions ||
            evaluation.line_specific_interview_questions.length === 0) ? (
            <div style={{ padding: '32px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
              No line-specific questions generated yet. Run Agent Evaluation to inspect repository files.
            </div>
          ) : (
            evaluation.line_specific_interview_questions.map((item, idx) => {
              const qText = typeof item === 'string' ? item : item.question;
              const pathText = typeof item === 'string' ? '' : item.path;
              const rangeText = typeof item === 'string' ? '' : item.line_range;
              const contextText = typeof item === 'string' ? '' : item.context;

              return (
                <div key={idx} className={styles.prepCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge appearance="filled" color="brand">
                        Question #{idx + 1}
                      </Badge>
                      {pathText && (
                        <code style={{ fontSize: '12px', color: tokens.colorBrandForeground1 }}>
                          {pathText} {rangeText ? `(${rangeText})` : ''}
                        </code>
                      )}
                    </div>

                    <Button
                      size="small"
                      appearance="subtle"
                      icon={copiedIndex === idx ? <CheckmarkRegular /> : <CopyRegular />}
                      onClick={() => handleCopy(qText, idx)}
                    >
                      {copiedIndex === idx ? 'Copied' : 'Copy Question'}
                    </Button>
                  </div>

                  <Body1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
                    {qText}
                  </Body1>

                  {contextText && (
                    <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                      Evaluation Context: {contextText}
                    </Caption1>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB-TAB 4: CLAIM VERIFICATION MATRIX */}
      {activeSubTab === 'matrix' && (
        <div style={{ overflowX: 'auto' }}>
          {(!evaluation?.claim_verification_matrix ||
            evaluation.claim_verification_matrix.length === 0) ? (
            <div style={{ padding: '32px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
              Claim verification matrix not yet populated.
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Target Skill / Capability</th>
                  <th className={styles.th}>Verification Status</th>
                  <th className={styles.th}>Evidence Citation / Rationale</th>
                </tr>
              </thead>
              <tbody>
                {evaluation.claim_verification_matrix.map((row, idx) => (
                  <tr key={idx}>
                    <td className={styles.td} style={{ fontWeight: 600 }}>
                      {row.skill}
                    </td>
                    <td className={styles.td}>{getMatrixStatusBadge(row.status)}</td>
                    <td className={styles.td} style={{ color: tokens.colorNeutralForeground2 }}>
                      {row.citation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
