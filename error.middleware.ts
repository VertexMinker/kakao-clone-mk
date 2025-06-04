import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || '서버 오류가 발생했습니다.';

  console.error(`[ERROR] ${statusCode} - ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
  });
};
