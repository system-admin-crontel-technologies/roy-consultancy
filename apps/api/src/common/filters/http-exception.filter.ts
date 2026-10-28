import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiError } from '@roy/types';
import { Prisma } from '../../generated/prisma/client.js';

/** Produces the consistent error envelope required by SRS section 9. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpError');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const correlationId = req.correlationId ?? 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message = 'An unexpected error occurred.';
    let details: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const b = body as { message?: string | string[]; error?: string };
        if (Array.isArray(b.message)) {
          details = b.message;
          message = 'Validation failed.';
        } else if (b.message) {
          message = b.message;
        }
        if (b.error) error = b.error;
      }
      if (error === 'Internal Server Error') error = HttpStatus[status] ?? error;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        error = 'Conflict';
        message = 'A record with the same unique value already exists.';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        error = 'Not Found';
        message = 'The requested record was not found.';
      } else {
        this.logger.error({ correlationId, code: exception.code, msg: exception.message });
      }
    } else {
      const err = exception as Error;
      this.logger.error({ correlationId, msg: err?.message, stack: err?.stack });
    }

    const payload: ApiError = { statusCode: status, error, message, correlationId };
    if (details) payload.details = details;
    res.status(status).json(payload);
  }
}
