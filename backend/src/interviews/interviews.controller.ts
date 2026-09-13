import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  Query,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewStatusDto } from './dto/update-interview-status.dto';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Get()
  async findAll(@Query('candidateId') candidateId?: string) {
    if (candidateId !== undefined) {
      const parsedId = Number(candidateId);
      if (!Number.isFinite(parsedId) || parsedId <= 0) {
        throw new BadRequestException('Invalid candidateId. Must be a positive integer.');
      }
      return this.interviewsService.findByCandidateId(parsedId);
    }
    return this.interviewsService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateInterviewDto) {
    return this.interviewsService.create(createDto);
  }

  @Patch(':id')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateInterviewStatusDto
  ) {
    return this.interviewsService.updateStatus(id, updateDto);
  }
}
