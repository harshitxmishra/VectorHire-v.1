import { Candidate, PipelineStage } from '@/lib/types';

export interface CandidateFilters {
  status?: string;
  college?: string;
  minScore?: number;
  maxScore?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export type CreateCandidateData = Omit<Partial<Candidate>, 'id' | 'created_at'> & {
  full_name: string;
  email: string;
};

export type UpdateCandidateData = Partial<Omit<Candidate, 'id' | 'created_at'>>;

export interface CandidateRepository {
  findAll(filters?: CandidateFilters): Promise<Candidate[]>;
  findById(id: number): Promise<Candidate | null>;
  findByIds(ids: number[]): Promise<Candidate[]>;
  create(candidate: CreateCandidateData): Promise<Candidate>;
  createMany(candidates: CreateCandidateData[]): Promise<Candidate[]>;
  update(id: number, data: UpdateCandidateData): Promise<Candidate>;
  updateStatus(id: number, status: PipelineStage | string): Promise<Candidate>;
  updateByEmail(email: string, patch: UpdateCandidateData): Promise<number[]>;
  delete(id: number): Promise<void>;
  /**
   * Dangerous operation: purges all candidates in the workspace.
   * Guarded for use only by dataset replacement and admin management workflows.
   */
  deleteAll(): Promise<void>;
}
