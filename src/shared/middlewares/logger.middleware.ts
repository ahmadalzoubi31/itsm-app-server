import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Middleware');
  use(req: Request, res: Response, next: NextFunction) {
    const method = req.method;
    const url = req.originalUrl;

    // req.user is usually undefined here unless you attach it earlier
    const username = (req.user as any)?.username || 'Unauthenticated';

    this.logger.log(`Incoming Request: User: ${username} | ${method} ${url}`);
    next();
  }
}
