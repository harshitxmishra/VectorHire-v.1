import {
  Injectable,
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import { supabase } from '@/lib/supabase/client';
import { EvaluateCandidateDto } from './dto/evaluate-candidate.dto';
import {
  AIEvaluationResult,
} from '@/lib/types';
import {
  runHiringCommittee,
  HiringCommitteeResult,
} from '@/lib/services/hiring-committee';

export type CandidateEvaluationResult = HiringCommitteeResult;

@Injectable()
export class AiService {
  async getCachedEvaluation(candidateId: number): Promise<CandidateEvaluationResult | null> {
    const { data: cached } = await supabase
      .from('candidates')
      .select('ai_evaluation')
      .eq('id', candidateId)
      .single();

    if (cached?.ai_evaluation) {
      return cached.ai_evaluation as CandidateEvaluationResult;
    }
    return null;
  }

  async evaluateCandidate(dto: EvaluateCandidateDto): Promise<CandidateEvaluationResult> {
    const force = dto.force === true;

    let candidateRecord: any = null;
    if (dto.candidate_id) {
      try {
        const { data: cand } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', dto.candidate_id)
          .single();
        candidateRecord = cand;
      } catch {
        // Non-fatal
      }
    }

    const evaluation = await runHiringCommittee({
      candidate_id: dto.candidate_id,
      full_name: dto.full_name,
      college: dto.college,
      cgpa: dto.cgpa,
      github: dto.github,
      status: dto.status,
      resume_text: candidateRecord?.resume_text,
      best_ai_project: candidateRecord?.best_ai_project,
      research_work: candidateRecord?.research_work,
      force,
    });

    return evaluation;
  }
}
