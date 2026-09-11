import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import {
  getInterviews,
  createInterview,
  updateInterviewStatus,
} from '@/lib/services/interview-service';
import { Interview } from '@/lib/types';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewStatusDto } from './dto/update-interview-status.dto';

@Injectable()
export class InterviewsService {
  async findAll(): Promise<Interview[]> {
    try {
      return await getInterviews();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch interviews';
      throw new InternalServerErrorException(message);
    }
  }

  async create(dto: CreateInterviewDto): Promise<Interview> {
    try {
      return await createInterview(dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create interview';
      if (message.includes('Candidate not found')) {
        throw new NotFoundException(message);
      }
      throw new InternalServerErrorException(message);
    }
  }

  async updateStatus(id: number, dto: UpdateInterviewStatusDto): Promise<Interview> {
    try {
      return await updateInterviewStatus(id, dto.status);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to update interview ${id}`;
      throw new InternalServerErrorException(message);
    }
  }
}
