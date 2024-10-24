import {createParamDecorator, ExecutionContext} from '@nestjs/common';
import {Types} from 'mongoose';

export const UserId = createParamDecorator((_: string, ctx: ExecutionContext): Types.ObjectId => {
  const userIdString: string | undefined = ctx.switchToHttp().getRequest<any>().session?.user?.id;
  return userIdString && new Types.ObjectId(userIdString);
});
export const UserEmail = createParamDecorator((_: string, ctx: ExecutionContext): Types.ObjectId | undefined => {
  return ctx.switchToHttp().getRequest<any>().session?.user?.email;
});
