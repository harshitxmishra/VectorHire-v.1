import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JobRepository } from '@/lib/repositories/job-repository';
import { JOB_REPOSITORY } from './jobs.constants';
import { JobDescription } from '@/lib/types';
import { CreateJobDto, UpdateJobDto } from './dto/job-input.dto';

@Injectable()
export class JobsService {
  constructor(
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: JobRepository,
  ) {}

  async findAll(): Promise<JobDescription[]> {
    try {
      return await this.jobRepository.findAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch job descriptions';
      throw new InternalServerErrorException(message);
    }
  }

  async findOne(id: number): Promise<JobDescription> {
    let job: JobDescription | null;
    try {
      job = await this.jobRepository.findById(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to fetch job description ${id}`;
      throw new InternalServerErrorException(message);
    }

    if (!job) {
      throw new NotFoundException(`Job description with ID ${id} not found.`);
    }

    return job;
  }

  async create(dto: CreateJobDto): Promise<JobDescription> {
    try {
      return await this.jobRepository.create(dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create job description';
      throw new InternalServerErrorException(message);
    }
  }

  async update(id: number, dto: UpdateJobDto): Promise<JobDescription> {
    // Verify existence
    await this.findOne(id);

    try {
      return await this.jobRepository.update(id, dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to update job description ${id}`;
      throw new InternalServerErrorException(message);
    }
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    // Verify existence
    await this.findOne(id);

    try {
      await this.jobRepository.delete(id);
      return { success: true, message: `Job description ${id} deleted.` };
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to delete job description ${id}`;
      throw new InternalServerErrorException(message);
    }
  }
}
