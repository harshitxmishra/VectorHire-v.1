import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  getJobDescriptions,
  createJobDescription,
  updateJobDescription,
  deleteJobDescription,
} from '@/lib/services/job-description-service';
import { JobDescription } from '@/lib/types';
import { CreateJobDto, UpdateJobDto } from './dto/job-input.dto';

@Injectable()
export class JobsService {
  async findAll(): Promise<JobDescription[]> {
    try {
      return await getJobDescriptions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch job descriptions';
      throw new InternalServerErrorException(message);
    }
  }

  async create(dto: CreateJobDto): Promise<JobDescription> {
    try {
      return await createJobDescription(dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create job description';
      throw new InternalServerErrorException(message);
    }
  }

  async update(id: number, dto: UpdateJobDto): Promise<JobDescription> {
    try {
      return await updateJobDescription(id, dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to update job description ${id}`;
      throw new InternalServerErrorException(message);
    }
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    try {
      await deleteJobDescription(id);
      return { success: true, message: `Job description ${id} deleted.` };
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to delete job description ${id}`;
      throw new InternalServerErrorException(message);
    }
  }
}
