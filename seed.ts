// 샘플 데이터 시드 파일
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 관리자 및 직원 계정 생성
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kyobobook.com' },
    update: {},
    create: {
      email: 'admin@kyobobook.com',
      name: '관리자',
      password: adminPassword,
      role: Role.admin,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@kyobobook.com' },
    update: {},
    create: {
      email: 'staff@kyobobook.com',
      name: '직원',
      password: staffPassword,
      role: Role.staff,
    },
  });

  console.log('사용자 계정이 생성되었습니다:', { admin, staff });

  // 샘플 제품 데이터 생성
  const products = [
    {
      name: '방탄소년단 - BE (Deluxe Edition)',
      sku: 'BTS001',
      category: '음반',
      brand: 'HYBE',
      location: '매장 A-1',
      quantity: 25,
      safetyStock: 10,
      price: 23000,
    },
    {
      name: '뉴진스 - Get Up',
      sku: 'NJS001',
      category: '음반',
      brand: 'ADOR',
      location: '매장 A-2',
      quantity: 30,
      safetyStock: 15,
      price: 19800,
    },
    {
      name: '아이유 - 조각집',
      sku: 'IU001',
      category: '음반',
      brand: 'EDAM',
      location: '매장 A-3',
      quantity: 20,
      safetyStock: 8,
      price: 17500,
    },
    {
      name: '해리 포터와 마법사의 돌',
      sku: 'BOOK001',
      category: '도서',
      brand: '문학수첩',
      location: '창고 B-1',
      quantity: 15,
      safetyStock: 5,
      price: 12600,
    },
    {
      name: '아이패드 파우치',
      sku: 'ACC001',
      category: '액세서리',
      brand: '핫트랙스',
      location: '매장 C-1',
      quantity: 40,
      safetyStock: 20,
      price: 15000,
    },
    {
      name: '스타벅스 텀블러',
      sku: 'ACC002',
      category: '액세서리',
      brand: '스타벅스',
      location: '매장 C-2',
      quantity: 12,
      safetyStock: 10,
      price: 28000,
    },
    {
      name: '몬스터 에너지 드링크',
      sku: 'DRK001',
      category: '음료',
      brand: '몬스터',
      location: '창고 D-1',
      quantity: 48,
      safetyStock: 24,
      price: 2500,
    },
    {
      name: '애플 에어팟 프로 2',
      sku: 'ELEC001',
      category: '전자기기',
      brand: '애플',
      location: '금고 E-1',
      quantity: 8,
      safetyStock: 5,
      price: 329000,
    },
    {
      name: '토이스토리 우디 인형',
      sku: 'TOY001',
      category: '완구',
      brand: '디즈니',
      location: '매장 F-1',
      quantity: 10,
      safetyStock: 5,
      price: 45000,
    },
    {
      name: '마블 엔드게임 포스터',
      sku: 'POST001',
      category: '포스터',
      brand: '마블',
      location: '매장 G-1',
      quantity: 18,
      safetyStock: 8,
      price: 12000,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  console.log('샘플 제품 데이터가 생성되었습니다.');

  // 샘플 재고 조정 이력 생성
  const adjustments = [
    {
      productSku: 'BTS001',
      userEmail: 'admin@kyobobook.com',
      quantity: 10,
      memo: '초기 입고',
    },
    {
      productSku: 'NJS001',
      userEmail: 'admin@kyobobook.com',
      quantity: 15,
      memo: '초기 입고',
    },
    {
      productSku: 'BTS001',
      userEmail: 'staff@kyobobook.com',
      quantity: -2,
      memo: '고객 구매',
    },
    {
      productSku: 'BOOK001',
      userEmail: 'admin@kyobobook.com',
      quantity: 5,
      memo: '추가 입고',
    },
  ];

  for (const adjustment of adjustments) {
    const product = await prisma.product.findUnique({
      where: { sku: adjustment.productSku },
    });
    
    const user = await prisma.user.findUnique({
      where: { email: adjustment.userEmail },
    });

    if (product && user) {
      await prisma.inventoryAdjustment.create({
        data: {
          productId: product.id,
          userId: user.id,
          quantity: adjustment.quantity,
          memo: adjustment.memo,
        },
      });
    }
  }

  console.log('샘플 재고 조정 이력이 생성되었습니다.');

  // 샘플 위치 변경 이력 생성
  const locationChanges = [
    {
      productSku: 'IU001',
      userEmail: 'admin@kyobobook.com',
      fromLocation: '창고 A-5',
      toLocation: '매장 A-3',
    },
    {
      productSku: 'ACC001',
      userEmail: 'staff@kyobobook.com',
      fromLocation: '창고 C-3',
      toLocation: '매장 C-1',
    },
  ];

  for (const change of locationChanges) {
    const product = await prisma.product.findUnique({
      where: { sku: change.productSku },
    });
    
    const user = await prisma.user.findUnique({
      where: { email: change.userEmail },
    });

    if (product && user) {
      await prisma.locationHistory.create({
        data: {
          productId: product.id,
          userId: user.id,
          fromLocation: change.fromLocation,
          toLocation: change.toLocation,
        },
      });
    }
  }

  console.log('샘플 위치 변경 이력이 생성되었습니다.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
