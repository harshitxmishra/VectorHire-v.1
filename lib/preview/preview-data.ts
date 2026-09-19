/**
 * Static, isolated demonstration data for the public VectorHire Product Preview (/preview).
 * This module contains ZERO real database records, calls NO APIs, and performs NO mutations.
 */

export interface PreviewMetric {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  description: string;
}

export interface PreviewCandidate {
  id: string;
  name: string;
  role: string;
  matchScore: number;
  status: 'Shortlisted' | 'Technical Round' | 'Offer Sent' | 'Screening';
  skills: string[];
  experience: string;
  education: string;
  avatarBg: string;
  highlight: string;
}

export interface PreviewActionItem {
  id: string;
  title: string;
  category: 'Review Required' | 'Interview Bottleneck' | 'AI High-Confidence Match';
  candidate: string;
  actionText: string;
  urgency: 'high' | 'medium';
}

export interface PreviewInterview {
  id: string;
  candidateName: string;
  role: string;
  time: string;
  type: string;
  interviewer: string;
  stage: string;
}

export interface PreviewPipelineStage {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PreviewCapability {
  title: string;
  description: string;
  iconName: string;
  badge: string;
}

export const PREVIEW_METRICS: PreviewMetric[] = [
  {
    title: 'Active Pipeline Candidates',
    value: '42',
    change: '+14% this month',
    trend: 'up',
    description: 'Candidates currently progressing across open roles',
  },
  {
    title: 'Mean AI Match Score',
    value: '91.4%',
    change: '+3.2% vs benchmark',
    trend: 'up',
    description: 'Contextual similarity score across active candidates',
  },
  {
    title: 'Time-to-Shortlist',
    value: '1.4 days',
    change: '-58% reduction',
    trend: 'up',
    description: 'Average hours from application to first recruiter action',
  },
  {
    title: 'Autonomous Screening Yield',
    value: '78%',
    change: '+12% pass rate',
    trend: 'up',
    description: 'Candidates meeting core technical requirements',
  },
];

export const PREVIEW_ACTION_ITEMS: PreviewActionItem[] = [
  {
    id: 'act-1',
    title: 'Top-tier Principal AI match requires review',
    category: 'AI High-Confidence Match',
    candidate: 'Sarah Chen (96% Match)',
    actionText: 'Review Profile & Schedule',
    urgency: 'high',
  },
  {
    id: 'act-2',
    title: 'Technical Round feedback pending submission',
    category: 'Interview Bottleneck',
    candidate: 'Arjun Mehta (Senior Backend)',
    actionText: 'Send Recruiter Reminder',
    urgency: 'medium',
  },
  {
    id: 'act-3',
    title: 'Automated code repository analysis completed',
    category: 'Review Required',
    candidate: 'Marcus Vance (Staff Systems)',
    actionText: 'Inspect GitHub Signals',
    urgency: 'medium',
  },
];

export const PREVIEW_CANDIDATES: PreviewCandidate[] = [
  {
    id: 'cand-preview-1',
    name: 'Sarah Chen',
    role: 'Lead ML Engineer',
    matchScore: 96,
    status: 'Shortlisted',
    skills: ['PyTorch', 'Transformers', 'Distributed Systems', 'CUDA', 'Python'],
    experience: '6+ yrs distributed AI systems',
    education: 'M.S. Computer Science, Stanford',
    avatarBg: '#6366f1',
    highlight: 'Authored high-throughput LLM serving optimizations. 100% vector similarity on model architecture requirements.',
  },
  {
    id: 'cand-preview-2',
    name: 'Arjun Mehta',
    role: 'Senior Backend Engineer',
    matchScore: 91,
    status: 'Technical Round',
    skills: ['Go', 'Kubernetes', 'PostgreSQL', 'Kafka', 'gRPC'],
    experience: '5 yrs cloud native microservices',
    education: 'B.Tech Computer Science, IIT Bombay',
    avatarBg: '#3b82f6',
    highlight: 'Built sub-millisecond event pipeline handling 2M ops/sec. Proven database clustering and caching expertise.',
  },
  {
    id: 'cand-preview-3',
    name: 'Elena Rostova',
    role: 'Senior Frontend Architect',
    matchScore: 89,
    status: 'Offer Sent',
    skills: ['React 19', 'TypeScript', 'Next.js', 'WebAssembly', 'Performance'],
    experience: '7 yrs enterprise UI architecture',
    education: 'B.S. Software Engineering, TU Munich',
    avatarBg: '#10b981',
    highlight: 'Core contributor to design systems. Optimized Largest Contentful Paint by 42% on high-traffic SaaS products.',
  },
  {
    id: 'cand-preview-4',
    name: 'Marcus Vance',
    role: 'Staff Systems Engineer',
    matchScore: 88,
    status: 'Screening',
    skills: ['Rust', 'Linux Kernel', 'eBPF', 'Docker', 'Observability'],
    experience: '8 yrs high-reliability infrastructure',
    education: 'B.S. Electrical & Computer Eng, Georgia Tech',
    avatarBg: '#8b5cf6',
    highlight: 'Extensive low-level kernel profiling with eBPF. Deep production experience with distributed consensus algorithms.',
  },
];

export const PREVIEW_AI_EVALUATION = {
  candidateName: 'Sarah Chen',
  targetRole: 'Lead ML Engineer',
  overallScore: 96,
  breakdown: [
    { area: 'Deep Learning & LLMs', score: 98, level: 'Exceptional', details: 'Expertise in Transformer fine-tuning, KV cache optimization, and vLLM.' },
    { area: 'Distributed Systems', score: 94, level: 'Strong', details: 'Extensive multi-GPU orchestration using Ray and Kubernetes.' },
    { area: 'Production Engineering', score: 95, level: 'Exceptional', details: 'Demonstrated experience deploying scalable inference endpoints with p99 < 50ms.' },
    { area: 'Architecture & Leadership', score: 92, level: 'Strong', details: 'Led 4-engineer sub-team delivering critical AI pipelines on schedule.' },
  ],
  summaryRationale:
    'Sarah demonstrates deep alignment with the Lead ML Engineer specification. Her background in distributed Transformer inference, quantization, and high-concurrency model serving matches all mandatory requirements.',
  recommendation: 'Fast-track to Hiring Manager Technical Deep-Dive',
};

export const PREVIEW_PIPELINE: PreviewPipelineStage[] = [
  { stage: 'Applied', count: 128, percentage: 100, color: '#6366f1' },
  { stage: 'AI Screened', count: 64, percentage: 50, color: '#3b82f6' },
  { stage: 'Shortlisted', count: 28, percentage: 22, color: '#0ea5e9' },
  { stage: 'Technical Round', count: 12, percentage: 9, color: '#10b981' },
  { stage: 'Offer Stage', count: 4, percentage: 3, color: '#22c55e' },
];

export const PREVIEW_INTERVIEWS: PreviewInterview[] = [
  {
    id: 'int-1',
    candidateName: 'Sarah Chen',
    role: 'Lead ML Engineer',
    time: 'Tomorrow, 10:30 AM',
    type: 'System Design & LLM Architecture',
    interviewer: 'Alex Mercer (VP Engineering)',
    stage: 'Final Round',
  },
  {
    id: 'int-2',
    candidateName: 'Arjun Mehta',
    role: 'Senior Backend Engineer',
    time: 'Thursday, 2:00 PM',
    type: 'Distributed Data Systems Deep-Dive',
    interviewer: 'David Vance (Staff Architect)',
    stage: 'Technical Round',
  },
  {
    id: 'int-3',
    candidateName: 'Marcus Vance',
    role: 'Staff Systems Engineer',
    time: 'Friday, 11:00 AM',
    type: 'Low-Level Systems & Observability',
    interviewer: 'Rachel Torres (Engineering Lead)',
    stage: 'Technical Round',
  },
];

export const PREVIEW_CAPABILITIES: PreviewCapability[] = [
  {
    title: 'Vector Semantic Matching',
    description: 'Embeds resumes and job specifications into high-dimensional semantic spaces for nuanced skill extraction beyond keyword matching.',
    iconName: 'Sparkle',
    badge: 'Core Engine',
  },
  {
    title: 'Autonomous Screening & Scoring',
    description: 'Calculates multi-dimensional suitability ratings across technical proficiencies, domain experience, and leadership indicators.',
    iconName: 'Bot',
    badge: 'Automation',
  },
  {
    title: 'Code Repository Intelligence',
    description: 'Inspects developer GitHub contributions, language velocity, commit frequencies, and open-source impact to verify engineering rigor.',
    iconName: 'Code',
    badge: 'Technical Signals',
  },
  {
    title: 'Frictionless Interview Operations',
    description: 'Coordinates automated calendar slot invitations, video meeting links, and candidate preparation briefings in one interface.',
    iconName: 'Calendar',
    badge: 'Operations',
  },
  {
    title: 'Campus Yield & Talent Analytics',
    description: 'Tracks institutional talent yields, conversion funnels, and demographic distributions to optimize recruitment campaigns.',
    iconName: 'Chart',
    badge: 'Intelligence',
  },
  {
    title: 'Enterprise Role-Based Governance',
    description: 'Enforces fine-grained permission models, audit trails, and strict JWT verification to keep candidate data secure.',
    iconName: 'Shield',
    badge: 'Security',
  },
];
