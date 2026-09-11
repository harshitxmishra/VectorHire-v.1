import { Candidate } from '@/lib/types';

export interface CandidateFilters {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CandidateRepository {
  findAll(filters?: CandidateFilters): Promise<Candidate[]>;
  findById(id: number): Promise<Candidate | null>;
  findByIds(ids: number[]): Promise<Candidate[]>;
  create(candidate: Partial<Candidate>): Promise<Candidate>;
  createMany(candidates: Partial<Candidate>[]): Promise<Candidate[]>;
  updateStatus(id: number, status: string): Promise<Candidate>;
  update(id: number, patch: Partial<Candidate>): Promise<Candidate>;
  updateByEmail(email: string, patch: Partial<Candidate>): Promise<number[]>;
  delete(id: number): Promise<void>;
  deleteAll(): Promise<void>;
}
