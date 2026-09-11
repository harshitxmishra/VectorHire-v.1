import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { DatasetsService } from './datasets.service';
import { DatasetUpload } from '@/lib/types';

@Controller('datasets')
@UseGuards(SupabaseAuthGuard)
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Get()
  async getDatasets(): Promise<DatasetUpload[]> {
    return this.datasetsService.getDatasets();
  }
}
