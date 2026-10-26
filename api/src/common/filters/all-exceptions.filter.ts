import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erro interno do servidor';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
        error = exception.name;
      } else {
        const res = body as { message?: string | string[]; error?: string };
        message = res.message ?? exception.message;
        error = res.error ?? exception.name;
      }
    }

    const summary = `${request.method} ${request.path} -> ${statusCode}`;

    if (statusCode >= 500) {
      const stack =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(summary, stack);
    } else {
      this.logger.warn(summary);
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      path: request.path,
      timestamp: new Date().toISOString(),
    });
  }
}