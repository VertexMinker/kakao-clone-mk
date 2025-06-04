# 백엔드 Dockerfile
FROM node:18-alpine

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# Prisma 생성 및 마이그레이션
RUN npx prisma generate
RUN npx prisma migrate deploy

# 빌드
RUN npm run build

# 실행
EXPOSE 3001
CMD ["npm", "start"]
