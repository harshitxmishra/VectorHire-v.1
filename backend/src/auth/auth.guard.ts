import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { AuthUser } from './auth.types';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private authClient: SupabaseClient | null = null;
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(private reflector: Reflector) {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    this.supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '';

    if (this.supabaseUrl && this.supabaseAnonKey) {
      this.authClient = createClient(this.supabaseUrl, this.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    // 1. Primary: Verify Supabase Auth session token
    if (token && this.authClient) {
      try {
        const {
          data: { user },
          error,
        } = await this.authClient.auth.getUser(token);

        if (user && !error) {
          const meta = user.user_metadata || {};
          const authUser: AuthUser = {
            id: user.id,
            email: user.email || 'user@vectorhire.ai',
            role: typeof meta.role === 'string' ? meta.role : 'Recruiter Admin',
            isDemo: false,
          };
          (request as any).user = authUser;
          return true;
        }
      } catch {
        // Fall through to production check or dev fallback
      }
    }

    // 2. Production Security Enforcement:
    // In production, unverified requests MUST be rejected (never trust client headers).
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException(
        'Authentication required. Valid session token missing or expired.'
      );
    }

    // 3. Local Development Mode Only:
    // In dev environments without active Supabase Auth credentials, allow the local
    // recruiter workspace with a fixed server-assigned identity.
    const isLocalDev =
      process.env.NODE_ENV === 'development' || !this.supabaseUrl || !this.supabaseAnonKey;
    if (isLocalDev) {
      const devUser: AuthUser = {
        id: 'dev-admin-01',
        email: 'admin@vectorhire.ai',
        role: 'Admin Workspace',
        isDemo: true,
      };
      (request as any).user = devUser;
      return true;
    }

    throw new UnauthorizedException('Authentication required. Please sign in.');
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }

    const cookieHeader = request.headers['cookie'];
    if (typeof cookieHeader === 'string') {
      const match =
        cookieHeader.match(/sb-[a-zA-Z0-9]+-auth-token=([^;]+)/) ||
        cookieHeader.match(/sb-access-token=([^;]+)/);

      if (match?.[1]) {
        try {
          const decoded = decodeURIComponent(match[1]);
          if (decoded.startsWith('[') || decoded.startsWith('{')) {
            const parsed = JSON.parse(decoded);
            return Array.isArray(parsed) ? parsed[0] : parsed.access_token || parsed;
          }
          return decoded;
        } catch {
          return match[1];
        }
      }
    }

    return null;
  }
}
