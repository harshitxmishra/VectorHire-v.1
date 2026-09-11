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
import { GitHubAnalysis } from '@/lib/services/github-service';

@Controller('ai/github')
@UseGuards(SupabaseAuthGuard)
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Post()
  async analyze(
    @Body() dto: AnalyzeGitHubDto,
  ): Promise<GitHubAnalysis> {
    return this.githubService.analyzeCandidate(dto.candidate_id);
  }

  @Post('search')
  async search(
    @Body() dto: SearchGitHubDto,
  ): Promise<GitHubAnalysis> {
    const target = dto.github || dto.url;
    if (!target) {
      throw new BadRequestException('github URL or username is required.');
    }
    return this.githubService.searchUrl(target);
  }
}
