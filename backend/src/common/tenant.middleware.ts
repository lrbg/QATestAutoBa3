import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenantId from JWT token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = jwt.decode(token) as JwtPayload;
        if (payload && payload.tenantId) {
          req.tenantId = payload.tenantId;
          req.userId = payload.sub;
        }
      } catch {
        // Token decode failed, continue without tenantId
      }
    }

    // Also check X-Tenant-ID header for service-to-service calls
    if (!req.tenantId && req.headers['x-tenant-id']) {
      req.tenantId = req.headers['x-tenant-id'] as string;
    }

    next();
  }
}
