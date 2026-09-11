import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import {
  getCandidates,
  getCandidateById,
  insertCandidates,
  updateCandidateStatus as domainUpdateStatus,
  deleteCandidate as domainDeleteCandidate,
} from '@/lib/services/candidate-service';
import { deleteAllCandidates as domainDeleteAll } from '@/lib/services/dataset-service';
import { logTimelineEvent } from '@/lib/services/timeline-service';
import { Candidate } from '@/lib/types';
import { CreateCandidateDto } from './dto/create-candidate.dto';

@Injectable()
export class CandidatesService {
  async findAll(): Promise<Candidate[]> {
    try {
      return await getCandidates();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch candidates';
      throw new InternalServerErrorException(message);
    }
  }

  async findOne(id: number): Promise<Candidate> {
    let candidate: Candidate | null;
    try {
      candidate = await getCandidateById(id);
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
      const inserted = await insertCandidates([dto]);
      const candidate = inserted?.[0] as Candidate;
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
    await this.findOne(id);

    try {
      const updated = await domainUpdateStatus(id, status);
      await logTimelineEvent(id, 'status_changed', `Moved to ${status}`);
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to update status for candidate ${id}`;
      throw new InternalServerErrorException(message);
    }
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    // Verify candidate exists first
    await this.findOne(id);

    try {
      await domainDeleteCandidate(id);
      return { success: true, message: `Candidate ${id} deleted.` };
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to delete candidate ${id}`;
      throw new InternalServerErrorException(message);
    }
  }

  async removeAll(): Promise<{ success: boolean; message: string }> {
    try {
      await domainDeleteAll();
      return { success: true, message: 'All candidate records purged successfully.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to purge candidates';
      throw new InternalServerErrorException(message);
    }
  }
}
