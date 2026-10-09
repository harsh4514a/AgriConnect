import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

/** Allow anonymous reads, but validate a Bearer token when one is supplied. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.headers.authorization) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    error: any,
    user: TUser,
    _info: any,
    _context: ExecutionContext,
    _status?: any,
  ): TUser {
    if (error || !user) {
      throw error || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
