import {
  Injectable,
  NotFoundException,
  BadRequestException,
  BadGatewayException,
} from '@nestjs/common';
import { supabase } from '@/lib/supabase/client';
import { parseResumeForCandidate } from '@/lib/services/resume-service';

@Injectable()
export class ResumeService {
  async validateCandidateForParsing(candidateId: number) {
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select('id, resume_url')
      .eq('id', candidateId)
      .single();

    if (error || !candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    if (!candidate.resume_url) {
      throw new BadRequestException('Candidate has no resume URL.');
    }

    return candidate;
  }

  async parseResume(candidateId: number) {
    const candidate = await this.validateCandidateForParsing(candidateId);

    const result = await parseResumeForCandidate(candidate.id, candidate.resume_url!);

    if (result.status === 'failed') {
      throw new BadGatewayException(result.error ?? 'Resume parsing failed.');
    }

    return result;
  }
}
