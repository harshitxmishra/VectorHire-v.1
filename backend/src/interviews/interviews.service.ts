import {
  Injectable,
  Inject,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InterviewRepository } from '@/lib/repositories/interview-repository';
import { INTERVIEW_REPOSITORY } from './interviews.constants';
import { CandidateRepository } from '@/lib/repositories/candidate-repository';
import { CANDIDATE_REPOSITORY } from '../candidates/candidates.constants';
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
  constructor(
    @Inject(INTERVIEW_REPOSITORY)
    private readonly interviewRepository: InterviewRepository,
    @Inject(CANDIDATE_REPOSITORY)
    private readonly candidateRepository: CandidateRepository,
  ) {}

  async findAll(): Promise<Interview[]> {
    try {
      return await getInterviews(this.interviewRepository);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch interviews';
      throw new InternalServerErrorException(message);
    }
  }

  async create(dto: CreateInterviewDto): Promise<Interview> {
    try {
      return await createInterview(dto, this.interviewRepository, this.candidateRepository);
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
      return await updateInterviewStatus(
        id,
        dto.status,
        this.interviewRepository,
        this.candidateRepository
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to update interview ${id}`;
      throw new InternalServerErrorException(message);
    }
  }
}
