import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminProfileResponse } from '../interfaces/admin-auth-response.interface';

export const CurrentAdmin = createParamDecorator(
  (data: keyof AdminProfileResponse | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const admin = request.user;
    return data && admin ? admin[data] : admin;
  },
);
