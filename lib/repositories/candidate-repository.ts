import { Candidate, PipelineStage } from '@/lib/types';

export type CandidateSortField = 'ai_score' | 'created_at' | 'full_name' | 'test_code' | 'id';
export type CandidateSortOrder = 'asc' | 'desc';

export interface CandidateFilters {
  status?: string;
  college?: string;
  minScore?: number;
  maxScore?: number;
  search?: string;
  sortBy?: CandidateSortField;
  sortOrder?: CandidateSortOrder;
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedCandidates {
  candidates: Candidate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type CreateCandidateData = Omit<Partial<Candidate>, 'id' | 'created_at'> & {
  full_name: string;
  email: string;
};

export type UpdateCandidateData = Partial<Omit<Candidate, 'id' | 'created_at'>>;

export interface CandidateRepository {
  findAll(filters?: CandidateFilters): Promise<Candidate[]>;
  findPaginated(filters?: CandidateFilters): Promise<PaginatedCandidates>;
  findById(id: number): Promise<Candidate | null>;
  findByIds(ids: number[]): Promise<Candidate[]>;
  create(candidate: CreateCandidateData): Promise<Candidate>;
  createMany(candidates: CreateCandidateData[]): Promise<Candidate[]>;
  update(id: number, data: UpdateCandidateData): Promise<Candidate>;
  updateStatus(id: number, status: PipelineStage | string): Promise<Candidate>;
  updateStatusMany(ids: number[], status: PipelineStage | string): Promise<Candidate[]>;
  updateByEmail(email: string, patch: UpdateCandidateData): Promise<number[]>;
  delete(id: number): Promise<void>;
  /**
   * Dangerous operation: purges all candidates in the workspace.
   * Guarded for use only by dataset replacement and admin management workflows.
   */
  deleteAll(): Promise<void>;
}
