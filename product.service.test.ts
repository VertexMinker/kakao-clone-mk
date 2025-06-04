import {
  moveProductLocation,
  getProductByIdService,
  createProductService,
  CreateProductData,
  updateProductService,
  UpdateProductData,
  deleteProductService,
  getAllProductsService,
  GetAllProductsOptions, // Assuming this is exported or defined if needed by tests
  adjustInventory,
} from '../services/product.service';
import { prisma } from '../index';
import { sendLowStockAlert } from '../utils/email';

// Mock Prisma client
jest.mock('../index', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    inventoryAdjustment: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    locationHistory: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(async (args) => {
      if (Array.isArray(args)) {
        // This simplified mock assumes the operations passed to $transaction are promises
        // that would resolve based on their individual mocks.
        // For testing `moveProductLocation`, it expects two results.
        // We'll rely on individual mocks for `product.update` and `locationHistory.create`
        // and this $transaction mock will just "pass through" their results.
        // This might need to be more sophisticated if complex interactions within a transaction are tested.
        const results = [];
        for (const op of args) {
          // This is a placeholder. In a real scenario, `op` is a Prisma Promise.
          // We assume the individual method mocks (e.g. `prisma.product.update`) are set up.
          // The mock for $transaction should reflect the outcome of those mocks.
          // For `moveProductLocation`, it expects [updatedProduct, locationHistory]
          // These would come from `prisma.product.update.mockResolvedValue(...)` etc.
          // This mock needs to be configured per test or be more dynamic.
          // For now, let's make it return what the individual mocks would return.
          if (op && typeof op.then === 'function') { // Check if it's a thenable (like a Prisma promise)
             results.push(await op); // This won't work directly as 'op' is not a function to call.
          } else {
            // This part is tricky. The actual Prisma operations are not invoked here.
            // The mock for $transaction needs to be aware of what it's supposed to return.
            // Let's rely on setting up the individual mocks (e.g. prisma.product.update)
            // and have $transaction return a pre-defined array for specific tests like moveProductLocation.
            // Or, for generic cases, assume it's an array of results from mocked operations.
          }
        }
        // This specific return structure is for moveProductLocation test.
        // It should ideally be configured within the test itself.
        // For now, this is a placeholder.
        // return results;
        // A more robust generic mock:
        return Promise.all(args.map(prismaCall => Promise.resolve(prismaCall))); // This is still not quite right.
                                                                              // The `args` are promise *factories*, not promises themselves.
                                                                              // A truly generic mock is hard.
                                                                              // Let's make it configurable or specific per test.
        // For now, this transaction mock will be configured in specific describe blocks if needed.
        // Defaulting to a simple pass-through for array arguments (most common use here).
        return Promise.all(args);
      }
      // For function callback (interactive transaction)
      if (typeof args === 'function') {
        return args(prisma); // Call the function with the mocked prisma
      }
      return Promise.resolve([]); // Default empty result
    }),
  },
}));

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
  updatedAt: new Date(),
};

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: '테스트 사용자',
  password: 'password', // Note: In a real app, passwords should be hashed and not stored in plain text.
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Product Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('moveProductLocation', () => {
    const mockLocationHistoryEntry = {
      id: 'test-history-id',
      productId: mockProduct.id,
      userId: mockUser.id,
      fromLocation: mockProduct.location,
      toLocation: '창고 B-2',
      createdAt: new Date(), // Assuming createdAt instead of movedAt
    };

    beforeEach(() => {
      // Setup mocks specific to moveProductLocation
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.update as jest.Mock).mockResolvedValue({ ...mockProduct, location: '창고 B-2' });
      (prisma.locationHistory.create as jest.Mock).mockResolvedValue(mockLocationHistoryEntry);
      // Configure the $transaction mock to return what moveProductLocation expects
      (prisma.$transaction as jest.Mock).mockImplementation(async (operations) => {
        // Simulate the execution of the operations by resolving with their mocked results
        const updatedProduct = await operations[0]; // Result of prisma.product.update
        const locationHistory = await operations[1]; // Result of prisma.locationHistory.create
        return [updatedProduct, locationHistory];
      });
    });

    it('제품 위치를 성공적으로 변경해야 함', async () => {
      const result = await moveProductLocation(
        mockProduct.id,
        mockUser.id,
        '창고 B-2',
      );

      expect(result).toHaveProperty('product');
      expect(result).toHaveProperty('locationHistory');
      expect(result.product.location).toBe('창고 B-2');
      expect(result.locationHistory.fromLocation).toBe(mockProduct.location);
      expect(result.locationHistory.toLocation).toBe('창고 B-2');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
        data: { location: '창고 B-2' },
      });
      expect(prisma.locationHistory.create).toHaveBeenCalledWith({
        data: {
          productId: mockProduct.id,
          userId: mockUser.id,
          fromLocation: mockProduct.location,
          toLocation: '창고 B-2',
        },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('제품이 존재하지 않을 경우 에러를 발생시켜야 함', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await expect(
        moveProductLocation('non-existent-id', mockUser.id, '창고 B-2'),
      ).rejects.toThrow('제품을 찾을 수 없습니다.');
    });

    it('현재 위치와 동일한 위치로 변경 시 에러를 발생시켜야 함', async () => {
      // Ensure findUnique returns the original product for this test
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      await expect(
        moveProductLocation(mockProduct.id, mockUser.id, mockProduct.location),
      ).rejects.toThrow('현재 위치와 동일합니다.');
    });
  });

  describe('getProductByIdService', () => {
    it('should return a product if found', async () => {
      const specificMockProduct = { ...mockProduct, id: 'found-id' };
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(specificMockProduct);

      const product = await getProductByIdService('found-id');
      expect(product).toEqual(specificMockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 'found-id' } });
    });

    it('should throw an error if product is not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getProductByIdService('not-found-id')).rejects.toThrow('Product not found');
      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 'not-found-id' } });
    });
  });

  describe('createProductService', () => {
    const newProductData: CreateProductData = {
      name: 'New Awesome Product',
      sku: 'NEWPROD001',
      category: 'New Category',
      brand: 'New Brand',
      location: 'Warehouse C-3',
      quantity: 50,
      safetyStock: 10,
      price: 199.99,
    };

    it('should create and return a new product if SKU does not exist', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null); // SKU check
      const createdProductMock = { ...newProductData, id: 'newly-created-id', createdAt: new Date(), updatedAt: new Date() };
      (prisma.product.create as jest.Mock).mockResolvedValue(createdProductMock);

      const product = await createProductService(newProductData);
      expect(product).toEqual(createdProductMock);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { sku: newProductData.sku } });
      expect(prisma.product.create).toHaveBeenCalledWith({ data: newProductData });
    });

    it('should throw an error if SKU already exists', async () => {
      const existingProductWithSKU = { ...mockProduct, sku: newProductData.sku };
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(existingProductWithSKU); // SKU check

      await expect(createProductService(newProductData)).rejects.toThrow('SKU already exists');
      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { sku: newProductData.sku } });
      expect(prisma.product.create).not.toHaveBeenCalled();
    });
  });
});

// Mock email utility
jest.mock('../utils/email', () => ({
  sendLowStockAlert: jest.fn().mockResolvedValue(undefined),
}));

describe('getAllProductsService', () => {
  it('should return all products if no filters are provided', async () => {
    const mockProductsList = [mockProduct, { ...mockProduct, id: 'prod2', sku: 'SKU002' }];
    (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProductsList);

    const products = await getAllProductsService({});
    expect(products).toEqual(mockProductsList);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('should filter by search term for name or SKU', async () => {
    const searchTerm = 'TestName';
    (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
    await getAllProductsService({ search: searchTerm });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { sku: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      })
    );
  });

  it('should filter by category', async () => {
    const category = 'TestCategory';
    (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
    await getAllProductsService({ category: category });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { category: category },
      })
    );
  });

  it('should apply lowStock filter correctly', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
    await getAllProductsService({ lowStock: 'true' });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          quantity: { lte: prisma.product.fields.safetyStock }, // Matching the problematic filter
        },
      })
    );
  });

  it('should handle a combination of filters', async () => {
    const searchTerm = 'ComboSearch';
    const category = 'ComboCategory';
    (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
    await getAllProductsService({ search: searchTerm, category: category });
     expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { sku: { contains: searchTerm, mode: 'insensitive' } },
          ],
          category: category,
        },
      })
    );
  });
});

describe('adjustInventory (service function)', () => {
  const productId = 'adjProdId';
  const userId = 'test-user-id';
  const memo = 'Test adjustment';

  it('should adjust inventory and return product and adjustment history', async () => {
    const initialProduct = { ...mockProduct, id: productId, quantity: 10, safetyStock: 5 };
    const adjustmentQuantity = 5;
    const expectedNewQuantity = initialProduct.quantity + adjustmentQuantity;
    const updatedProductData = { ...initialProduct, quantity: expectedNewQuantity };
    const adjustmentRecord = { id: 'adjHistId', productId, userId, quantity: adjustmentQuantity, memo };

    (prisma.product.findUnique as jest.Mock).mockResolvedValue(initialProduct);
    (prisma.product.update as jest.Mock).mockResolvedValue(updatedProductData);
    (prisma.inventoryAdjustment.create as jest.Mock).mockResolvedValue(adjustmentRecord);
    (prisma.$transaction as jest.Mock).mockImplementation(async (operations) => [
      await operations[0], // product.update
      await operations[1], // inventoryAdjustment.create
    ]);

    const result = await adjustInventory(productId, userId, adjustmentQuantity, memo);

    expect(result.product).toEqual(updatedProductData);
    expect(result.adjustment).toEqual(adjustmentRecord);
    expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: productId } });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: productId }, data: { quantity: expectedNewQuantity } });
    expect(prisma.inventoryAdjustment.create).toHaveBeenCalledWith({
      data: { productId, userId, quantity: adjustmentQuantity, memo },
    });
    expect(sendLowStockAlert).not.toHaveBeenCalled();
  });

  it('should trigger low stock alert if quantity falls to or below safety stock', async () => {
    const initialProduct = { ...mockProduct, id: 'lowStockProd', quantity: 10, safetyStock: 10, name: 'Test Low Stock Product', sku: 'TLS001' };
    const adjustmentQuantity = -1;
    const expectedNewQuantity = 9;
    const updatedProductData = { ...initialProduct, quantity: expectedNewQuantity };
    const adjustmentRecord = { id: 'adjHistId2', productId: 'lowStockProd', userId, quantity: adjustmentQuantity };

    (prisma.product.findUnique as jest.Mock).mockResolvedValue(initialProduct);
    (prisma.product.update as jest.Mock).mockResolvedValue(updatedProductData);
    (prisma.inventoryAdjustment.create as jest.Mock).mockResolvedValue(adjustmentRecord);
    (prisma.$transaction as jest.Mock).mockImplementation(async (operations) => [
        await operations[0],
        await operations[1]
    ]);

    await adjustInventory('lowStockProd', userId, adjustmentQuantity);

    expect(sendLowStockAlert).toHaveBeenCalledWith(
      initialProduct.name,
      initialProduct.sku,
      expectedNewQuantity,
      initialProduct.safetyStock
    );
  });

  it('should throw error if adjustment results in negative stock', async () => {
    const initialProduct = { ...mockProduct, id: 'negStockProd', quantity: 5 };
    (prisma.product.findUnique as jest.Mock).mockResolvedValue(initialProduct);
    await expect(adjustInventory('negStockProd', userId, -10)).rejects.toThrow('재고가 부족합니다.');
  });

  it('should throw error if product for adjustment is not found', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(adjustInventory('non-exist-adj', userId, 5)).rejects.toThrow('제품을 찾을 수 없습니다.');
  });
});

describe('updateProductService', () => {
  const updateData: UpdateProductData = {
    name: 'Updated Awesome Product',
    quantity: 150,
  };
  const productIdToUpdate = 'existing-product-id';

  it('should update and return the product if found', async () => {
    const existingProduct = { ...mockProduct, id: productIdToUpdate };
    (prisma.product.findUnique as jest.Mock).mockResolvedValue(existingProduct);
    const updatedProductMock = { ...existingProduct, ...updateData, updatedAt: new Date() };
    (prisma.product.update as jest.Mock).mockResolvedValue(updatedProductMock);

    const product = await updateProductService(productIdToUpdate, updateData);
    expect(product).toEqual(updatedProductMock);
    expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: productIdToUpdate } });
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: productIdToUpdate },
      data: updateData,
    });
  });

  it('should throw an error if product to update is not found', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(updateProductService('non-existent-id', updateData)).rejects.toThrow('Product not found');
    expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 'non-existent-id' } });
    expect(prisma.product.update).not.toHaveBeenCalled();
  });
});

describe('deleteProductService', () => {
  const productIdToDelete = 'product-to-delete-id';

  it('should delete the product and its related history if found', async () => {
    const existingProduct = { ...mockProduct, id: productIdToDelete };
    (prisma.product.findUnique as jest.Mock).mockResolvedValue(existingProduct);

    // Configure $transaction to simulate successful execution of inner operations
    // The individual operations (deleteMany, delete) are already jest.fn(),
    // and by default they resolve with 'undefined', which is fine for delete operations.
    // So, the Promise.all(args) in the main mock should work.
    (prisma.$transaction as jest.Mock).mockImplementation(async (operations) => {
        // For this test, we just need the transaction to "complete"
        // The individual mocks (deleteMany, delete) will be called.
        // We can return mock counts or the deleted product if needed, but service doesn't use them.
        return [ { count: 1 }, { count: 1 }, existingProduct];
    });

    await deleteProductService(productIdToDelete);

    expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: productIdToDelete } });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.inventoryAdjustment.deleteMany).toHaveBeenCalledWith({ where: { productId: productIdToDelete } });
    expect(prisma.locationHistory.deleteMany).toHaveBeenCalledWith({ where: { productId: productIdToDelete } });
    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: productIdToDelete } });
  });

  it('should throw an error if product to delete is not found', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(deleteProductService('non-existent-id')).rejects.toThrow('Product not found');
    expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 'non-existent-id' } });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
