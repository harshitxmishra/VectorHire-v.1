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
}

export interface AIEvaluationResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  interviewQuestions: string[];
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
