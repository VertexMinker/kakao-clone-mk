import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

interface JwtPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.',
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: '유효한 토큰이 필요합니다.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-key'
    ) as JwtPayload;

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: '인증에 실패했습니다.',
    });
  }
};

export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: '관리자 권한이 필요합니다.',
    });
  }
  next();
};
