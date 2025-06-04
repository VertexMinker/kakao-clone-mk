import { Request, Response } from 'express';
import { prisma } from '../index';
import { sendLowStockAlert } from '../utils/email';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { 
      search, 
      category, 
      brand, 
      location, 
      lowStock 
    } = req.query;

    const filters: any = {};
    
    if (search) {
      filters.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (category) {
      filters.category = category as string;
    }
    
    if (brand) {
      filters.brand = brand as string;
    }
    
    if (location) {
      filters.location = location as string;
    }
    
    if (lowStock === 'true') {
      filters.quantity = {
        lte: prisma.product.fields.safetyStock
      };
    }

    const products = await prisma.product.findMany({
      where: filters,
      orderBy: { updatedAt: 'desc' }
    });

    return res.status(200).json({
      status: 'success',
      data: products
    });
  } catch (error) {
    console.error('제품 조회 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '제품 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: '제품을 찾을 수 없습니다.'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('제품 상세 조회 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '제품 정보를 불러오는 중 오류가 발생했습니다.'
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      sku, 
      category, 
      brand, 
      location, 
      quantity, 
      safetyStock, 
      price 
    } = req.body;
    
    // SKU 중복 확인
    const existingProduct = await prisma.product.findUnique({
      where: { sku }
    });
    
    if (existingProduct) {
      return res.status(400).json({
        status: 'error',
        message: '이미 존재하는 SKU입니다.'
      });
    }
    
    const newProduct = await prisma.product.create({
      data: {
        name,
        sku,
        category,
        brand,
        location,
        quantity: parseInt(quantity),
        safetyStock: parseInt(safetyStock),
        price: parseFloat(price)
      }
    });
    
    return res.status(201).json({
      status: 'success',
      data: newProduct
    });
  } catch (error) {
    console.error('제품 생성 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '제품을 생성하는 중 오류가 발생했습니다.'
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      category, 
      brand, 
      location, 
      quantity, 
      safetyStock, 
      price 
    } = req.body;
    
    // 제품 존재 확인
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      return res.status(404).json({
        status: 'error',
        message: '제품을 찾을 수 없습니다.'
      });
    }
    
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        brand,
        location,
        quantity: parseInt(quantity),
        safetyStock: parseInt(safetyStock),
        price: parseFloat(price)
      }
    });
    
    return res.status(200).json({
      status: 'success',
      data: updatedProduct
    });
  } catch (error) {
    console.error('제품 수정 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '제품을 수정하는 중 오류가 발생했습니다.'
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 제품 존재 확인
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      return res.status(404).json({
        status: 'error',
        message: '제품을 찾을 수 없습니다.'
      });
    }
    
    // 관련 이력 삭제
    await prisma.inventoryAdjustment.deleteMany({
      where: { productId: id }
    });
    
    await prisma.locationHistory.deleteMany({
      where: { productId: id }
    });
    
    // 제품 삭제
    await prisma.product.delete({
      where: { id }
    });
    
    return res.status(200).json({
      status: 'success',
      message: '제품이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('제품 삭제 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '제품을 삭제하는 중 오류가 발생했습니다.'
    });
  }
};

export const adjustInventory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, memo } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.'
      });
    }
    
    // 제품 존재 확인
    const product = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: '제품을 찾을 수 없습니다.'
      });
    }
    
    const adjustmentQuantity = parseInt(quantity);
    const newQuantity = product.quantity + adjustmentQuantity;
    
    if (newQuantity < 0) {
      return res.status(400).json({
        status: 'error',
        message: '재고가 부족합니다.'
      });
    }
    
    // 트랜잭션으로 재고 조정 및 이력 생성
    const [updatedProduct, adjustment] = await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { quantity: newQuantity }
      }),
      prisma.inventoryAdjustment.create({
        data: {
          productId: id,
          userId,
          quantity: adjustmentQuantity,
          memo
        }
      })
    ]);
    
    // 안전 재고 이하로 떨어졌는지 확인하고 알림 발송
    if (newQuantity <= product.safetyStock) {
      await sendLowStockAlert(product.name, product.sku, newQuantity, product.safetyStock);
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        product: updatedProduct,
        adjustment
      }
    });
  } catch (error) {
    console.error('재고 조정 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '재고를 조정하는 중 오류가 발생했습니다.'
    });
  }
};

export const moveProductLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { toLocation } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.'
      });
    }
    
    // 제품 존재 확인
    const product = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: '제품을 찾을 수 없습니다.'
      });
    }
    
    const fromLocation = product.location;
    
    // 위치가 같으면 변경 불필요
    if (fromLocation === toLocation) {
      return res.status(400).json({
        status: 'error',
        message: '현재 위치와 동일합니다.'
      });
    }
    
    // 트랜잭션으로 위치 변경 및 이력 생성
    const [updatedProduct, locationHistory] = await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { location: toLocation }
      }),
      prisma.locationHistory.create({
        data: {
          productId: id,
          userId,
          fromLocation,
          toLocation
        }
      })
    ]);
    
    return res.status(200).json({
      status: 'success',
      data: {
        product: updatedProduct,
        locationHistory
      }
    });
  } catch (error) {
    console.error('위치 변경 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '위치를 변경하는 중 오류가 발생했습니다.'
    });
  }
};

export const getLocationHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 제품 존재 확인
    const product = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: '제품을 찾을 수 없습니다.'
      });
    }
    
    // 위치 이력 조회
    const locationHistory = await prisma.locationHistory.findMany({
      where: { productId: id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { movedAt: 'desc' }
    });
    
    return res.status(200).json({
      status: 'success',
      data: locationHistory
    });
  } catch (error) {
    console.error('위치 이력 조회 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '위치 이력을 조회하는 중 오류가 발생했습니다.'
    });
  }
};

export const exportProducts = async (req: Request, res: Response) => {
  try {
    const { 
      search, 
      category, 
      brand, 
      location, 
      lowStock 
    } = req.query;

    const filters: any = {};
    
    if (search) {
      filters.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (category) {
      filters.category = category as string;
    }
    
    if (brand) {
      filters.brand = brand as string;
    }
    
    if (location) {
      filters.location = location as string;
    }
    
    if (lowStock === 'true') {
      filters.quantity = {
        lte: prisma.product.fields.safetyStock
      };
    }

    const products = await prisma.product.findMany({
      where: filters,
      orderBy: { updatedAt: 'desc' }
    });

    // CSV 형식으로 변환
    const header = 'ID,SKU,상품명,카테고리,브랜드,위치,수량,안전재고,단가,생성일,수정일\n';
    const rows = products.map(product => {
      return `${product.id},${product.sku},"${product.name}",${product.category},${product.brand},${product.location},${product.quantity},${product.safetyStock},${product.price},${product.createdAt.toISOString()},${product.updatedAt.toISOString()}`;
    }).join('\n');
    
    const csv = header + rows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    
    return res.status(200).send(csv);
  } catch (error) {
    console.error('제품 내보내기 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '제품 목록을 내보내는 중 오류가 발생했습니다.'
    });
  }
};
