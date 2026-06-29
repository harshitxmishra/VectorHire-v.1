export type ParsingStatus = 'not_applicable' | 'pending' | 'success' | 'failed';

export interface Candidate {
  id: number;
  created_at: string;
  full_name: string;
  email: string;
  college: string;
  cgpa: number;
  github: string | null;
  status: string;
  ai_score: number;
  branch: string | null;
  best_ai_project: string | null;
  research_work: string | null;
  resume_url: string | null;
  resume_text: string | null;
  parsing_status: ParsingStatus;
  parsed_at: string | null;
  test_la: number | null;
  test_code: number | null;
  dataset_id: number | null;
  github_score: number | null;
  github_summary: string | null;
  github_languages: string[];
  github_portfolio_verdict: string | null;
  github_highlights: string[];
  github_strongest_repo: string | null;
  github_last_analyzed: string | null;
  ai_evaluation: AIEvaluationResult | null;
  ai_evaluated_at: string | null;
}

export interface GitHubIntelligence {
  score: number;
  summary: string;
  languages: string[];
  portfolioVerdict: string;
  highlights: string[];
  strongestRepo: string | null;
}

export interface AIEvaluationResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  interviewQuestions: string[];
}

export interface DatasetUpload {
  id: number;
  created_at: string;
  dataset_name: string;
  uploaded_by: string | null;
  mode: 'replace' | 'append';
  total_candidates: number;
}

export interface JobDescription {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  requirements: string;
}

export interface JobMatchResult {
  id: number;
  created_at: string;
  candidate_id: number;
  job_description_id: number;
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  experience_match: string;
  education_match: string;
  recommendation: string;
  evaluated_at: string;
}

export interface KPIData {
  totalCandidates: number;
  shortlisted: number;
  pendingReview: number;
  averageAIScore: number;
  topCollege: string;
  highScorers: number;
  assessmentsPending: number;
  assessmentsCompleted: number;
  upcomingInterviews: number;
  offers: number;
  hireRate: number;
  interviewsThisWeek: number;
}

export interface CollegeGroup {
  college: string;
  totalCandidates: number;
  shortlistedCount: number;
  averageAIScore: number;
}

export interface ScoreBucket {
  label: string;
  count: number;
}

export const PIPELINE_STAGES = [
  'Applied',
  'Reviewing',
  'Shortlisted',
  'Assessment Sent',
  'Assessment Completed',
  'Interview Eligible',
  'Interview Scheduled',
  'Interview Completed',
  'Offer Extended',
  'Rejected',
  'Hired',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface Interview {
  id: number;
  created_at: string;
  candidate_id: number;
  interviewer_name: string;
  scheduled_date: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  calendar_event_id: string | null;
  meet_link: string | null;
  candidates?: { full_name: string; email: string } | null;
}

export interface EmailLog {
  id: number;
  created_at: string;
  candidate_id: number;
  email_type: 'assessment' | 'interview' | 'offer';
  recipient: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  sent_at: string | null;
}

export interface TimelineEvent {
  id: number;
  created_at: string;
  candidate_id: number;
  event_type: string;
  details: string | null;
}

