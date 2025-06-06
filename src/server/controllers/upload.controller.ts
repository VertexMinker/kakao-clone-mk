import { Request, Response } from 'express';
import { prisma } from '../index';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseCsvFile,
  parseXlsxFile,
  validateProducts,
} from '../utils/productUpload';

export const bulkUploadProducts = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: '파일이 업로드되지 않았습니다.',
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    let rawProducts: Record<string, unknown>[] = [];

    // 파일 형식에 따라 처리
    if (fileExtension === '.xlsx') {
      rawProducts = await parseXlsxFile(filePath);
    } else if (fileExtension === '.csv') {
      rawProducts = await parseCsvFile(filePath);
    } else {
      // 파일 삭제
      fs.unlinkSync(filePath);

      return res.status(400).json({
        status: 'error',
        message:
          '지원되지 않는 파일 형식입니다. XLSX 또는 CSV 파일만 업로드 가능합니다.',
      });
    }

    // 파일 삭제
    fs.unlinkSync(filePath);

    if (rawProducts.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '파일에 데이터가 없습니다.',
      });
    }

    // 데이터 유효성 검사 및 변환
    const { validProducts, errors } = validateProducts(rawProducts);

    if (validProducts.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '유효한 제품 데이터가 없습니다.',
        errors,
      });
    }

    // 제품 대량 업로드 (upsert)
    const results = [];

    for (const product of validProducts) {
      const result = await prisma.product.upsert({
        where: { sku: product.sku },
        update: {
          name: product.name,
          category: product.category,
          brand: product.brand,
          location: product.location,
          quantity: product.quantity,
          safetyStock: product.safetyStock,
          price: product.price,
        },
        create: product,
      });

      results.push(result);
    }

    return res.status(200).json({
      status: 'success',
      message: `${results.length}개의 제품이 업로드되었습니다.`,
      data: {
        successCount: results.length,
        errorCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('대량 업로드 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '제품을 대량 업로드하는 중 오류가 발생했습니다.',
    });
  }
};
