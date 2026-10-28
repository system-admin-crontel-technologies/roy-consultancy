import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

const HEADER = 'x-correlation-id';
const SAFE = /^[A-Za-z0-9._-]{8,128}$/;

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.header(HEADER);
    const id = incoming && SAFE.test(incoming) ? incoming : randomUUID();
    req.correlationId = id;
    res.setHeader(HEADER, id);
    next();
  }
}
