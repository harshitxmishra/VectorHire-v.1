import {
  Injectable,
  Inject,
  NotFoundException,
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import { aiGenerateJSON } from '@/lib/ai/client';
import { AISchema } from '@/lib/ai/types';
import { JobMatchResult } from '@/lib/types';
import { MatchCandidateJobDto } from './dto/match-candidate-job.dto';
import { QueryJobMatchesDto } from './dto/query-job-matches.dto';
import { BatchMatchDto } from './dto/batch-match.dto';
import { JOB_MATCH_REPOSITORY } from './matching.constants';
import { CANDIDATE_REPOSITORY } from '../candidates/candidates.constants';
import { JOB_REPOSITORY } from '../jobs/jobs.constants';
import { TIMELINE_REPOSITORY } from '../timeline/timeline.constants';
import { JobMatchRepository, PaginatedJobMatches } from '@/lib/repositories/job-match-repository';
import { CandidateRepository } from '@/lib/repositories/candidate-repository';
import { JobRepository } from '@/lib/repositories/job-repository';
import { TimelineRepository } from '@/lib/repositories/timeline-repository';

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
  constructor(
    @Inject(JOB_MATCH_REPOSITORY)
    private readonly jobMatchRepo: JobMatchRepository,
    @Inject(CANDIDATE_REPOSITORY)
    private readonly candidateRepo: CandidateRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobRepo: JobRepository,
    @Inject(TIMELINE_REPOSITORY)
    private readonly timelineRepo: TimelineRepository,
  ) {}

  async getMatchesForJD(jobDescriptionId: number): Promise<JobMatchResult[]> {
    try {
      return await this.jobMatchRepo.findByJobDescriptionId(jobDescriptionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch job matches';
      throw new InternalServerErrorException(message);
    }
  }

  async getPaginatedMatchesForJD(
    jobDescriptionId: number,
    filters?: QueryJobMatchesDto
  ): Promise<PaginatedJobMatches> {
    const job = await this.jobRepo.findById(jobDescriptionId);
    if (!job) {
      throw new NotFoundException(`Job description with ID ${jobDescriptionId} not found.`);
    }

    try {
      return await this.jobMatchRepo.findPaginatedByJobId(jobDescriptionId, filters);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch paginated job matches';
      throw new InternalServerErrorException(message);
    }
  }

  async getBestMatches(): Promise<Record<number, number>> {
    try {
      return await this.jobMatchRepo.findBestScoresPerCandidate();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch best matches';
      throw new InternalServerErrorException(message);
    }
  }

  async evaluateCandidateMatch(dto: MatchCandidateJobDto): Promise<MatchResult> {
    const [candidate, jobDescription] = await Promise.all([
      this.candidateRepo.findById(dto.candidate_id),
      this.jobRepo.findById(dto.job_description_id),
    ]);

    if (!candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    if (!jobDescription) {
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
      throw new BadGatewayException('JD matching is temporarily unavailable. Please try again shortly.');
    }

    await this.jobMatchRepo.upsert({
      candidate_id: dto.candidate_id,
      job_description_id: dto.job_description_id,
      match_percentage: parsed.matchPercentage,
      matched_skills: parsed.matchedSkills,
      missing_skills: parsed.missingSkills,
      experience_match: parsed.experienceMatch,
      education_match: parsed.educationMatch,
      recommendation: parsed.recommendation,
    });

    await this.timelineRepo.create({
      candidate_id: dto.candidate_id,
      event_type: 'jd_matched',
      details: `${parsed.matchPercentage}% match`,
    });

    return parsed;
  }

  async batchEvaluateMatches(
    jobDescriptionId: number,
    dto: BatchMatchDto
  ): Promise<{ evaluated: number; totalCandidates: number }> {
    const jobDescription = await this.jobRepo.findById(jobDescriptionId);
    if (!jobDescription) {
      throw new NotFoundException(`Job description with ID ${jobDescriptionId} not found.`);
    }

    let candidateIdsToMatch: number[] = [];

    if (dto.candidate_ids && dto.candidate_ids.length > 0) {
      candidateIdsToMatch = dto.candidate_ids;
    } else {
      const allCandidates = await this.candidateRepo.findAll();
      candidateIdsToMatch = allCandidates.map((c) => c.id);
    }

    if (!dto.force) {
      const existingMatches = await this.jobMatchRepo.findByJobDescriptionId(jobDescriptionId);
      const matchedSet = new Set(existingMatches.map((m) => m.candidate_id));
      candidateIdsToMatch = candidateIdsToMatch.filter((id) => !matchedSet.has(id));
    }

    let evaluated = 0;
    for (const candidateId of candidateIdsToMatch) {
      try {
        await this.evaluateCandidateMatch({
          candidate_id: candidateId,
          job_description_id: jobDescriptionId,
        });
        evaluated++;
      } catch (err) {
        // Continue processing batch even if single candidate fails
      }
    }

    return {
      evaluated,
      totalCandidates: candidateIdsToMatch.length,
    };
  }
}
