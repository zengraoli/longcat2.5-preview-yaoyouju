import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentAdminInfo {
  adminId: string;
  name: string;
  roleName: string;
  permissions: string[];
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentAdminInfo => {
    return ctx.switchToHttp().getRequest().admin;
  },
);
