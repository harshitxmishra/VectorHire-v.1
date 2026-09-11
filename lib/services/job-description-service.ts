import { JobDescription } from '@/lib/types';
import { JobRepository, CreateJobData, UpdateJobData } from '@/lib/repositories/job-repository';
import { SupabaseJobRepository } from '@/lib/repositories/supabase-job-repository';

const defaultJobRepository: JobRepository = new SupabaseJobRepository();

export async function getJobDescriptions(
  repo: JobRepository = defaultJobRepository
): Promise<JobDescription[]> {
  return repo.findAll();
}

export async function getJobDescriptionById(
  id: number,
  repo: JobRepository = defaultJobRepository
): Promise<JobDescription | null> {
  return repo.findById(id);
}

export async function createJobDescription(
  input: CreateJobData,
  repo: JobRepository = defaultJobRepository
): Promise<JobDescription> {
  return repo.create(input);
}

export async function updateJobDescription(
  id: number,
  input: UpdateJobData,
  repo: JobRepository = defaultJobRepository
): Promise<JobDescription> {
  return repo.update(id, input);
}

export async function deleteJobDescription(
  id: number,
  repo: JobRepository = defaultJobRepository
): Promise<void> {
  return repo.delete(id);
}
