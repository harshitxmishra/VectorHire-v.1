import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { SupabaseAuthGuard } from './auth/auth.guard';
import { HealthModule } from './health/health.module';
import { CandidatesModule } from './candidates/candidates.module';
import { JobsModule } from './jobs/jobs.module';
import { InterviewsModule } from './interviews/interviews.module';
import { TimelineModule } from './timeline/timeline.module';
import { MatchingModule } from './matching/matching.module';
import { AiModule } from './ai/ai.module';
import { EmailModule } from './email/email.module';
import { ResumeModule } from './resume/resume.module';
import { GithubModule } from './github/github.module';
import { DatasetsModule } from './datasets/datasets.module';
import { QueueModule } from './queue/queue.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env.local', '../.env', '.env.local', '.env'],
      validate: validateEnv,
    }),

    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100, // 100 req/min default
      },
    ]),
    AuthModule,
    HealthModule,
    QueueModule,
    CandidatesModule,
    JobsModule,
    InterviewsModule,
    TimelineModule,
    MatchingModule,
    AiModule,
    EmailModule,
    ResumeModule,
    GithubModule,
    DatasetsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
