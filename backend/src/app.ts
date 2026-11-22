import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [env.CLIENT_ORIGIN],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base health check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    data: {
      status: 'ok',
      service: 'hirehub-backend',
      timestamp: new Date().toISOString(),
    },
  });
});

// Centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'An unexpected error occurred';
  const details = err.details || undefined;

  if (env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('Server error:', err);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
    },
  });
});
