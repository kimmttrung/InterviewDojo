import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';
import { Messages } from '../constants/messages.constant';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Ưu tiên: @ResponseMessage > DEFAULT theo method
    const customMessage = this.reflector.getAllAndOverride<string>(
      RESPONSE_MESSAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const message =
      customMessage ??
      Messages.DEFAULT[request.method as keyof typeof Messages.DEFAULT] ??
      'Thao tác thành công';

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: data ?? null,
        message,
      })),
    );
  }
}
