// src/common/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    // data chứa các field bổ sung (error, code, banReason, ...)
    let data: Record<string, unknown> | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const raw = exception.getResponse();

      if (typeof raw === 'string') {
        // throw new BadRequestException('some string')
        message = raw;
      } else if (typeof raw === 'object' && raw !== null) {
        const rawObj = raw as Record<string, unknown>;

        // Lấy message — ưu tiên string, nếu là array (class-validator) thì join
        if (typeof rawObj['message'] === 'string') {
          message = rawObj['message'];
        } else if (Array.isArray(rawObj['message'])) {
          message = (rawObj['message'] as string[]).join('; ');
        }

        // Flatten tất cả field còn lại vào data (trừ message và statusCode)
        // Đây là nơi code, error, banReason, remainingDays, ... sẽ được expose
        const { message: _msg, statusCode: _sc, ...rest } = rawObj;
        if (Object.keys(rest).length > 0) {
          data = rest;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.error('Unknown exception', JSON.stringify(exception));
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      data,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
