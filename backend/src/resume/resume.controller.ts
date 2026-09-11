import {
  Controller,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { ResumeService } from './resume.service';

@Controller('candidates')
@UseGuards(SupabaseAuthGuard)
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post(':id/parse-resume')
  async parseResume(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.resumeService.parseResume(id);
  }
}
