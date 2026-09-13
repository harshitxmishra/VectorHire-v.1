import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CandidateRepository,
  PaginatedCandidates,
} from '@/lib/repositories/candidate-repository';
import { CANDIDATE_REPOSITORY } from './candidates.constants';
import { logTimelineEvent } from '@/lib/services/timeline-service';
import { Candidate } from '@/lib/types';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { QueryCandidatesDto } from './dto/query-candidates.dto';

@Injectable()
export class CandidatesService {
  constructor(
    @Inject(CANDIDATE_REPOSITORY)
    private readonly candidateRepository: CandidateRepository,
  ) {}

  async findAll(): Promise<Candidate[]> {
    try {
      return await this.candidateRepository.findAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch candidates';
      throw new InternalServerErrorException(message);
    }
  }

  async findPaginated(query?: QueryCandidatesDto): Promise<PaginatedCandidates> {
    try {
      return await this.candidateRepository.findPaginated(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch candidates';
      throw new InternalServerErrorException(message);
    }
  }

  async findOne(id: number): Promise<Candidate> {
    let candidate: Candidate | null;
    try {
      candidate = await this.candidateRepository.findById(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to fetch candidate ${id}`;
      throw new InternalServerErrorException(message);
    }

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found.`);
    }

    return candidate;
  }

  async create(dto: CreateCandidateDto): Promise<Candidate> {
    try {
      const candidate = await this.candidateRepository.create(dto);
      if (candidate?.id) {
        await logTimelineEvent(candidate.id, 'applied', 'Candidate profile created');
      }
      return candidate;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create candidate';
      throw new InternalServerErrorException(message);
    }
  }

  async updateStatus(id: number, status: string): Promise<Candidate> {
    // Verify candidate exists first
    const existing = await this.findOne(id);

    try {
      const updated = await this.candidateRepository.updateStatus(id, status);
      if (!existing || existing.status?.toLowerCase() !== status.toLowerCase()) {
        try {
          await logTimelineEvent(id, 'status_changed', `Moved to ${status}`);
        } catch {
          // Best effort timeline logging
        }
      }
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to update status for candidate ${id}`;
      throw new InternalServerErrorException(message);
    }
  }

  async bulkUpdateStatus(
    candidateIds: number[],
    status: string,
  ): Promise<{ updated: number; candidates: Candidate[] }> {
    if (!candidateIds || candidateIds.length === 0) {
      return { updated: 0, candidates: [] };
    }

    try {
      // 1. Fetch current candidates to check if status actually changes
      const existing = await this.candidateRepository.findByIds(candidateIds);
      const statusChangedMap = new Map<number, boolean>();
      for (const c of existing) {
        statusChangedMap.set(c.id, c.status?.toLowerCase() !== status.toLowerCase());
      }

      // 2. Perform bulk update
      const updated = await this.candidateRepository.updateStatusMany(candidateIds, status);

      // 3. Conditionally log timeline events only for candidates whose status actually changed
      for (const candidate of updated) {
        if (statusChangedMap.get(candidate.id)) {
          try {
            await logTimelineEvent(candidate.id, 'status_changed', `Bulk updated to ${status}`);
          } catch {
            // Non-blocking timeline event
          }
        }
      }

      return {
        updated: updated.length,
        candidates: updated,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to bulk update candidates';
      throw new InternalServerErrorException(message);
    }
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    // Verify candidate exists first
    await this.findOne(id);

    try {
      await this.candidateRepository.delete(id);
      return { success: true, message: `Candidate ${id} deleted.` };
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to delete candidate ${id}`;
      throw new InternalServerErrorException(message);
    }
  }

  async removeAll(): Promise<{ success: boolean; message: string }> {
    try {
      await this.candidateRepository.deleteAll();
      return { success: true, message: 'All candidate records purged successfully.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to purge candidates';
      throw new InternalServerErrorException(message);
    }
  }
}
