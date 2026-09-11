import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { GithubService } from './github.service';
import { AnalyzeGitHubDto } from './dto/analyze-github.dto';
import { SearchGitHubDto } from './dto/search-github.dto';
import { GitHubIntelligence } from '@/lib/types';

@Controller('ai/github')
@UseGuards(SupabaseAuthGuard)
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Post()
  async analyze(
    @Body() dto: AnalyzeGitHubDto,
  ): Promise<GitHubIntelligence> {
    return this.githubService.analyzeCandidate(dto.candidate_id);
  }

  @Post('search')
  async search(
    @Body() dto: SearchGitHubDto,
  ): Promise<GitHubIntelligence> {
    const target = dto.github || dto.url;
    if (!target) {
      throw new BadRequestException('github URL or username is required.');
    }
    return this.githubService.searchUrl(target);
  }
}
