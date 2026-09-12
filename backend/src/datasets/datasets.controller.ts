import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { DatasetsService } from './datasets.service';
import { QueueService } from '../queue/queue.service';
import { DatasetUpload } from '@/lib/types';
import { DatasetJobStatusResponse } from '../queue/dataset/dataset.types';
import { stageDatasetFile, cleanupStagedFile } from './dataset-staging.util';
import { resolveCorrelationId } from '../common/utils/correlation-id.util';
import * as crypto from 'crypto';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller('datasets')
@UseGuards(SupabaseAuthGuard)
export class DatasetsController {
  constructor(
    private readonly datasetsService: DatasetsService,
    private readonly queueService: QueueService
  ) {}

  @Get()
  async getDatasets(): Promise<DatasetUpload[]> {
    return this.datasetsService.getDatasets();
  }

  @Post('import')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    })
  )
  async importDataset(
    @UploadedFile() file: MulterFile | undefined,
    @Body('mode') modeInput?: string,
    @Body('datasetName') datasetNameInput?: string,
    @Body('uploadedBy') uploadedByInput?: string,
    @Headers('x-correlation-id') correlationHeader?: string
  ) {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('No file uploaded or file is empty.');
    }

    const originalName = file.originalname || '';
    if (originalName && !originalName.toLowerCase().endsWith('.csv') && !file.mimetype.includes('csv') && !file.mimetype.includes('text')) {
      throw new BadRequestException('Uploaded file must be a valid CSV file.');
    }

    const mode: 'replace' | 'append' = modeInput === 'replace' ? 'replace' : 'append';
    const datasetName = datasetNameInput || file.originalname || 'Untitled dataset';
    const uploadedBy = uploadedByInput || null;

    const uploadId = crypto.randomUUID();
    const correlationId = resolveCorrelationId(correlationHeader);

    try {
      // 1. Stage the file securely in the dedicated staging directory
      await stageDatasetFile(file.buffer, uploadId);

      // 2. Enqueue the dataset import job in BullMQ
      const job = await this.queueService.enqueueDatasetImport({
        uploadId,
        datasetName,
        uploadedBy,
        mode,
        correlationId,
        enqueuedAt: Date.now(),
      });

      return {
        jobId: job.id,
        status: 'queued',
        correlationId,
      };
    } catch (err) {
      // Clean up staged file if enqueue fails
      await cleanupStagedFile(uploadId);
      throw err;
    }
  }

  @Get('jobs/:jobId')
  async getJobStatus(@Param('jobId') jobId: string): Promise<DatasetJobStatusResponse> {
    const status = await this.queueService.getDatasetJobStatus(jobId);
    if (!status) {
      throw new NotFoundException(`Dataset import job with ID ${jobId} not found`);
    }
    return status;
  }
}
