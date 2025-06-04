import { moveProductLocation } from '../services/product.service';
import { prisma } from '../index';

describe('Product Service', () => {
  // 테스트 데이터
  const mockProduct = {
    id: 'test-product-id',
    name: '테스트 상품',
    sku: 'TEST001',
    category: '테스트',
    brand: '테스트 브랜드',
    location: '매장 A-1',
    quantity: 10,
    safetyStock: 5,
    price: 10000,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: '테스트 사용자',
    password: 'password',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockLocationHistory = {
    id: 'test-history-id',
    productId: mockProduct.id,
    userId: mockUser.id,
    fromLocation: mockProduct.location,
    toLocation: '창고 B-2',
    movedAt: new Date()
  };

  // 모킹 설정
  beforeEach(() => {
    // Prisma 클라이언트 모킹
    jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(mockProduct);
    jest.spyOn(prisma.product, 'update').mockResolvedValue({
      ...mockProduct,
      location: '창고 B-2'
    });
    jest.spyOn(prisma.locationHistory, 'create').mockResolvedValue(mockLocationHistory);
    jest.spyOn(prisma, '$transaction').mockImplementation((callback) => {
      if (Array.isArray(callback)) {
        return Promise.resolve([
          { ...mockProduct, location: '창고 B-2' },
          mockLocationHistory
        ]);
      }
      return Promise.resolve(null);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('moveProductLocation', () => {
    it('제품 위치를 성공적으로 변경해야 함', async () => {
      const result = await moveProductLocation(
        mockProduct.id,
        mockUser.id,
        '창고 B-2'
      );

      // 결과 검증
      expect(result).toHaveProperty('product');
      expect(result).toHaveProperty('locationHistory');
      expect(result.product.location).toBe('창고 B-2');
      expect(result.locationHistory.fromLocation).toBe(mockProduct.location);
      expect(result.locationHistory.toLocation).toBe('창고 B-2');

      // Prisma 호출 검증
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: mockProduct.id }
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('제품이 존재하지 않을 경우 에러를 발생시켜야 함', async () => {
      // 제품이 없는 경우 모킹
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValueOnce(null);

      await expect(
        moveProductLocation(
          'non-existent-id',
          mockUser.id,
          '창고 B-2'
        )
      ).rejects.toThrow('제품을 찾을 수 없습니다.');
    });

    it('현재 위치와 동일한 위치로 변경 시 에러를 발생시켜야 함', async () => {
      await expect(
        moveProductLocation(
          mockProduct.id,
          mockUser.id,
          mockProduct.location
        )
      ).rejects.toThrow('현재 위치와 동일합니다.');
    });
  });
});
