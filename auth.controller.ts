import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: '이메일과 비밀번호를 입력해주세요.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '로그인 처리 중 오류가 발생했습니다.',
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: '리프레시 토큰이 필요합니다.',
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key'
    ) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '유효하지 않은 토큰입니다.',
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return res.status(200).json({
      status: 'success',
      data: {
        accessToken,
      },
    });
  } catch (error) {
    console.error('토큰 갱신 오류:', error);
    return res.status(401).json({
      status: 'error',
      message: '토큰 갱신에 실패했습니다.',
    });
  }
};
