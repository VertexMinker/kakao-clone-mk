import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
// import { sendLowStockAlert } from '../utils/email'; // Not directly used in controller, but by service
import { productService } from '../services/productService';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { search, category, brand, location, lowStock } = req.query;

    // Pass query parameters as an object to the service
    const products = await productService.getProducts({ // Changed here
      search: search as string | undefined,
      category: category as string | undefined,
      brand: brand as string | undefined,
      location: location as string | undefined,
      lowStock: lowStock as string | undefined,
    });

    return res.status(200).json({
      status: 'success',
      data: products,
    });
  } catch (error) {
    console.error('제품 조회 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '제품 목록을 불러오는 중 오류가 발생했습니다.',
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id); // Changed here

    return res.status(200).json({
      status: 'success',
      data: product,
    });
  } catch (error: any) {
    if (error.message === 'Product not found') {
      return res.status(404).json({
        status: 'error',
        message: '제품을 찾을 수 없습니다.',
      });
    }
    console.error('제품 상세 조회 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '제품 정보를 불러오는 중 오류가 발생했습니다.',
    });
  }
};

// Zod schema for creating a product
const createProductSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  sku: z.string().min(1, { message: 'SKU is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  brand: z.string().min(1, { message: 'Brand is required' }),
  location: z.string().min(1, { message: 'Location is required' }),
  quantity: z.preprocess(
    (val) => parseInt(String(val), 10),
    z
      .number({ invalid_type_error: 'Quantity must be a number' })
      .int()
      .min(0, { message: 'Quantity must be a non-negative integer' }),
  ),
  safetyStock: z.preprocess(
    (val) => parseInt(String(val), 10),
    z
      .number({ invalid_type_error: 'Safety stock must be a number' })
      .int()
      .min(0, { message: 'Safety stock must be a non-negative integer' }),
  ),
  price: z.preprocess(
    (val) => parseFloat(String(val)),
    z
      .number({ invalid_type_error: 'Price must be a number' })
      .positive({ message: 'Price must be a positive number' }),
  ),
});

export const createProduct = async (req: Request, res: Response) => {
  try {
    const result = createProductSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }

    const productDetails = result.data;
    const newProduct = await productService.createProduct(productDetails); // Changed here

    return res.status(201).json({
      status: 'success',
      data: newProduct,
    });
  } catch (error: any) {
    if (error.message === 'SKU already exists') {
      return res.status(400).json({
        // 409 Conflict could also be appropriate
        status: 'error',
        message: '이미 존재하는 SKU입니다.',
      });
    }
    console.error('제품 생성 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '제품을 생성하는 중 오류가 발생했습니다.',
    });
  }
};

// Zod schema for updating a product
const updateProductSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name cannot be empty if provided' })
    .optional(),
  category: z
    .string()
    .min(1, { message: 'Category cannot be empty if provided' })
    .optional(),
  brand: z
    .string()
    .min(1, { message: 'Brand cannot be empty if provided' })
    .optional(),
  location: z
    .string()
    .min(1, { message: 'Location cannot be empty if provided' })
    .optional(),
  quantity: z.preprocess(
    (val) =>
      val === undefined || val === null || String(val).trim() === ''
        ? undefined
        : parseInt(String(val), 10),
    z
      .number({ invalid_type_error: 'Quantity must be a number' })
      .int()
      .min(0, { message: 'Quantity must be a non-negative integer' })
      .optional(),
  ),
  safetyStock: z.preprocess(
    (val) =>
      val === undefined || val === null || String(val).trim() === ''
        ? undefined
        : parseInt(String(val), 10),
    z
      .number({ invalid_type_error: 'Safety stock must be a number' })
      .int()
      .min(0, { message: 'Safety stock must be a non-negative integer' })
      .optional(),
  ),
  price: z.preprocess(
    (val) =>
      val === undefined || val === null || String(val).trim() === ''
        ? undefined
        : parseFloat(String(val)),
    z
      .number({ invalid_type_error: 'Price must be a number' })
      .positive({ message: 'Price must be a positive number' })
      .optional(),
  ),
});

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = updateProductSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }

    const updateData = result.data;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields provided for update.',
      });
    }

    const updatedProduct = await productService.updateProduct(id, updateData); // Changed here

    return res.status(200).json({
      status: 'success',
      data: updatedProduct,
    });
  } catch (error: any) {
    if (error.message === 'Product not found') {
      return res.status(404).json({
        status: 'error',
        message: '제품을 찾을 수 없습니다.',
      });
    }
    console.error('제품 수정 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '제품을 수정하는 중 오류가 발생했습니다.',
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const paramsSchema = z.object({
      id: z.string().uuid({ message: 'Invalid product ID format' }),
    });
    const paramsResult = paramsSchema.safeParse(req.params);

    if (!paramsResult.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid URL parameters',
        errors: paramsResult.error.flatten().fieldErrors,
      });
    }
    const { id } = paramsResult.data;
    await productService.deleteProduct(id); // Changed here

    return res.status(200).json({
      status: 'success',
      message: '제품이 성공적으로 삭제되었습니다.',
    });
  } catch (error: any) {
    if (error.message === 'Product not found') {
      return res.status(404).json({
        status: 'error',
        message: '제품을 찾을 수 없습니다.',
      });
    }
    console.error('제품 삭제 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '제품을 삭제하는 중 오류가 발생했습니다.',
    });
  }
};

// Zod schemas for adjustInventory
const adjustInventoryParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid product ID format' }),
});

const adjustInventoryBodySchema = z.object({
  quantity: z.preprocess(
    (val) => parseInt(String(val), 10),
    z
      .number({
        required_error: 'Quantity is required',
        invalid_type_error: 'Quantity must be a number',
      })
      .int({ message: 'Quantity must be an integer' }),
  ),
  memo: z.string().optional(),
});

export const adjustInventory = async (req: Request, res: Response) => {
  try {
    const paramsResult = adjustInventoryParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid URL parameters',
        errors: paramsResult.error.flatten().fieldErrors,
      });
    }
    const { id: productId } = paramsResult.data;

    const bodyResult = adjustInventoryBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request body',
        errors: bodyResult.error.flatten().fieldErrors,
      });
    }
    const { quantity: adjustmentQuantity, memo } = bodyResult.data;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.',
      });
    }

    const result = await productService.adjustInventory( // Changed here
      productId,
      userId,
      adjustmentQuantity,
      memo,
    );

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error: any) {
    if (error.message === '제품을 찾을 수 없습니다.') {
      return res.status(404).json({
        status: 'error',
        message: '제품을 찾을 수 없습니다.',
      });
    }
    if (error.message === '재고가 부족합니다.') {
      return res.status(400).json({
        status: 'error',
        message: '재고가 부족합니다.',
      });
    }
    console.error('재고 조정 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '재고를 조정하는 중 오류가 발생했습니다.',
    });
  }
};

// Zod schemas for moveProductLocation
const moveProductLocationParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid product ID format' }),
});

const moveProductLocationBodySchema = z.object({
  toLocation: z.string().min(1, { message: 'toLocation is required' }),
});

export const moveProductLocation = async (req: Request, res: Response) => {
  try {
    const paramsResult = moveProductLocationParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid URL parameters',
        errors: paramsResult.error.flatten().fieldErrors,
      });
    }
    const { id: productId } = paramsResult.data;

    const bodyResult = moveProductLocationBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request body',
        errors: bodyResult.error.flatten().fieldErrors,
      });
    }
    const { toLocation } = bodyResult.data;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.',
      });
    }

    const result = await productService.moveLocation( // Changed here
      productId,
      userId,
      toLocation,
    );

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error: any) {
    if (error.message === '제품을 찾을 수 없습니다.') {
      return res.status(404).json({
        status: 'error',
        message: '제품을 찾을 수 없습니다.',
      });
    }
    if (error.message === '현재 위치와 동일합니다.') {
      return res.status(400).json({
        status: 'error',
        message: '현재 위치와 동일합니다.',
      });
    }
    console.error('위치 변경 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '위치를 변경하는 중 오류가 발생했습니다.',
    });
  }
};

export const getLocationHistory = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const locationHistory = await productService.getLocationHistory(productId); // Changed here

    return res.status(200).json({
      status: 'success',
      data: locationHistory,
    });
  } catch (error: any) {
    if (error.message === '제품을 찾을 수 없습니다.') {
      return res.status(404).json({
        status: 'error',
        message: '제품을 찾을 수 없습니다.',
      });
    }
    console.error('위치 이력 조회 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '위치 이력을 조회하는 중 오류가 발생했습니다.',
    });
  }
};

export const exportProducts = async (req: Request, res: Response) => {
  try {
    const { search, category, brand, location, lowStock } = req.query;

    const products = await productService.getProductsForExport({ // Changed here
      search: search as string | undefined,
      category: category as string | undefined,
      brand: brand as string | undefined,
      location: location as string | undefined,
      lowStock: lowStock as string | undefined,
    });

    // CSV 형식으로 변환
    const header =
      'ID,SKU,상품명,카테고리,브랜드,위치,수량,안전재고,단가,생성일,수정일\n';
    const rows = products
      .map((product) => {
        return `${product.id},${product.sku},"${product.name}",${product.category},${product.brand},${product.location},${product.quantity},${product.safetyStock},${product.price},${product.createdAt.toISOString()},${product.updatedAt.toISOString()}`;
      })
      .join('\n');

    const csv = header + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');

    return res.status(200).send(csv);
  } catch (error) {
    console.error('제품 내보내기 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '제품 목록을 내보내는 중 오류가 발생했습니다.',
    });
  }
};
