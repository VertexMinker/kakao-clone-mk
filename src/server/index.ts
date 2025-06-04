import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import syncRoutes from './routes/sync.routes';
import { errorHandler } from './middlewares/error.middleware';

// 환경 변수 로드
dotenv.config();

// Prisma 클라이언트 초기화
export const prisma = new PrismaClient();

// Express 앱 초기화
const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api', syncRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: '교보문고 핫트랙스 송도점 재고관리 시스템 API' });
});

// 에러 핸들러
app.use(errorHandler);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

// 종료 시 Prisma 연결 해제
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
