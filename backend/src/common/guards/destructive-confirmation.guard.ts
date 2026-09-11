import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class DestructiveConfirmationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const confirmed = request.headers['x-confirm-destructive'] === 'true';

    if (!confirmed) {
      throw new BadRequestException(
        "Confirmation header 'x-confirm-destructive: true' is required for destructive candidate operations."
      );
    }

    return true;
  }
}
