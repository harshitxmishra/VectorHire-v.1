import {
  Injectable,
  NotFoundException,
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import { supabase } from '@/lib/supabase/client';
import { aiGenerateJSON } from '@/lib/ai/client';
import { AISchema } from '@/lib/ai/types';
import {
  getJobMatchesForJD,
  getBestMatchPerCandidate,
  upsertJobMatch,
} from '@/lib/services/job-match-service';
import { logTimelineEvent } from '@/lib/services/timeline-service';
import { JobMatchResult } from '@/lib/types';
import { MatchCandidateJobDto } from './dto/match-candidate-job.dto';

export type MatchResult = {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: string;
  educationMatch: string;
  recommendation: string;
};

const matchSchema: AISchema = {
  type: 'object',
  properties: {
    matchPercentage: { type: 'number', minimum: 0, maximum: 100 },
    matchedSkills: { type: 'array', items: { type: 'string' } },
    missingSkills: { type: 'array', items: { type: 'string' } },
    experienceMatch: { type: 'string' },
    educationMatch: { type: 'string' },
    recommendation: { type: 'string' },
  },
  required: [
    'matchPercentage',
    'matchedSkills',
    'missingSkills',
    'experienceMatch',
    'educationMatch',
    'recommendation',
  ],
};

@Injectable()
export class MatchingService {
  async getMatchesForJD(jobDescriptionId: number): Promise<JobMatchResult[]> {
    try {
      return await getJobMatchesForJD(jobDescriptionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch job matches';
      throw new InternalServerErrorException(message);
    }
  }

  async getBestMatches(): Promise<Record<number, number>> {
    try {
      return await getBestMatchPerCandidate();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch best matches';
      throw new InternalServerErrorException(message);
    }
  }

  async evaluateCandidateMatch(dto: MatchCandidateJobDto): Promise<MatchResult> {
    const [{ data: candidate, error: candidateError }, { data: jobDescription, error: jdError }] =
      await Promise.all([
        supabase.from('candidates').select('*').eq('id', dto.candidate_id).single(),
        supabase.from('job_descriptions').select('*').eq('id', dto.job_description_id).single(),
      ]);

    if (candidateError || !candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    if (jdError || !jobDescription) {
      throw new NotFoundException('Job description not found.');
    }

    const prompt = `You are a technical recruiter comparing a candidate against a job description.

Job Description: ${jobDescription.title}
Requirements:
${jobDescription.requirements}

Candidate:
Name: ${candidate.full_name}
Skills/Branch: ${candidate.branch ?? 'Unknown'}
Best AI Project: ${candidate.best_ai_project ?? 'None provided'}
Research Work: ${candidate.research_work ?? 'None provided'}
GitHub: ${candidate.github ?? 'None provided'}
Resume: ${candidate.resume_text ?? 'Not available'}
Aptitude Score: ${candidate.test_la ?? 'Not taken'}
Coding Score: ${candidate.test_code ?? 'Not taken'}

Evaluate how well this candidate matches the job description. Score matchPercentage from 0-100.
List matchedSkills (skills/requirements the candidate clearly satisfies) and missingSkills (requirements not evidenced).
Give a short experienceMatch and educationMatch assessment, and an overall recommendation.`;

    let parsed: MatchResult;
    try {
      parsed = await aiGenerateJSON<MatchResult>({ prompt, schema: matchSchema });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI matching failed';
      throw new BadGatewayException('JD matching is temporarily unavailable. Please try again shortly.');
    }

    await upsertJobMatch({
      candidate_id: dto.candidate_id,
      job_description_id: dto.job_description_id,
      match_percentage: parsed.matchPercentage,
      matched_skills: parsed.matchedSkills,
      missing_skills: parsed.missingSkills,
      experience_match: parsed.experienceMatch,
      education_match: parsed.educationMatch,
      recommendation: parsed.recommendation,
    });

    await logTimelineEvent(dto.candidate_id, 'jd_matched', `${parsed.matchPercentage}% match`);

    return parsed;
  }
}
