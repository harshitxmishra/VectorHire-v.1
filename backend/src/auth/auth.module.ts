import { Module, Global } from '@nestjs/common';
import { SupabaseAuthGuard } from './auth.guard';
import { DestructiveConfirmationGuard } from '../common/guards/destructive-confirmation.guard';

@Global()
@Module({
  providers: [SupabaseAuthGuard, DestructiveConfirmationGuard],
  exports: [SupabaseAuthGuard, DestructiveConfirmationGuard],
})
export class AuthModule {}
