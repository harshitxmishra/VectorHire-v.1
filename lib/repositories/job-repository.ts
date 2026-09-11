import { JobDescription } from '@/lib/types';

export type CreateJobData = {
  title: string;
  requirements: string;
};

export type UpdateJobData = {
  title?: string;
  requirements?: string;
};

export interface JobRepository {
  findAll(): Promise<JobDescription[]>;
  findById(id: number): Promise<JobDescription | null>;
  create(data: CreateJobData): Promise<JobDescription>;
  update(id: number, data: UpdateJobData): Promise<JobDescription>;
  delete(id: number): Promise<void>;
}
