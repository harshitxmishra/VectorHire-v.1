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
