import { Module } from '@nestjs/common';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { QueueModule } from '../queue/queue.module';
import { GithubWorker } from '../queue/github/github.worker';

@Module({
  imports: [QueueModule],
  controllers: [GithubController],
  providers: [GithubService, GithubWorker],
  exports: [GithubService],
})
export class GithubModule {}
