import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateStatusDto } from './dto/update-candidate-status.dto';
import { QueryCandidatesDto } from './dto/query-candidates.dto';
import { BulkUpdateCandidateStatusDto } from './dto/bulk-update-status.dto';
import { DestructiveConfirmationGuard } from '../common/guards/destructive-confirmation.guard';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  async findAll(@Query() query?: QueryCandidatesDto) {
    if (
      query &&
      (query.search ||
        query.status ||
        query.college ||
        query.minScore !== undefined ||
        query.maxScore !== undefined ||
        query.sortBy ||
        query.page ||
        query.limit)
    ) {
      return this.candidatesService.findPaginated(query);
    }
    return this.candidatesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.candidatesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateCandidateDto) {
    return this.candidatesService.create(createDto);
  }

  @Patch('bulk-status')
  async bulkUpdateStatus(@Body() bulkDto: BulkUpdateCandidateStatusDto) {
    return this.candidatesService.bulkUpdateStatus(bulkDto.candidateIds, bulkDto.status);
  }

  @Patch(':id')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCandidateStatusDto
  ) {
    return this.candidatesService.updateStatus(id, updateDto.status);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.candidatesService.remove(id);
  }

  @Delete()
  @UseGuards(DestructiveConfirmationGuard)
  async removeAll() {
    return this.candidatesService.removeAll();
  }
}
