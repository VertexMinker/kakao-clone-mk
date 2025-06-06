import { Request, Response } from 'express';
import { prisma } from '../index';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

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

    let products: any[] = [];

    // 파일 형식에 따라 처리
    if (fileExtension === '.xlsx') {
      // Excel 파일 처리
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      const headers = (worksheet.getRow(1).values as string[]).slice(1);
      products = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowValues = row.values as any[];
        const product: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          product[String(header)] = rowValues[index + 1];
        });
        products.push(product);
      });
    } else if (fileExtension === '.csv') {
      // CSV 파일 처리
      products = await new Promise((resolve, reject) => {
        const results: any[] = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', (error) => reject(error));
      });
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

    if (products.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '파일에 데이터가 없습니다.',
      });
    }

    // 데이터 유효성 검사 및 변환
    const validProducts = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const rowNumber = i + 2; // 헤더 행과 0-인덱스 고려

      // 필수 필드 확인
      if (
        !product.name ||
        !product.sku ||
        !product.category ||
        !product.brand ||
        !product.location ||
        product.quantity === undefined ||
        product.safetyStock === undefined ||
        product.price === undefined
      ) {
        errors.push(`${rowNumber}행: 필수 필드가 누락되었습니다.`);
        continue;
      }

      // 데이터 타입 변환
      try {
        validProducts.push({
          name: String(product.name),
          sku: String(product.sku),
          category: String(product.category),
          brand: String(product.brand),
          location: String(product.location),
          quantity: parseInt(product.quantity),
          safetyStock: parseInt(product.safetyStock),
          price: parseFloat(product.price),
        });
      } catch (error) {
        errors.push(`${rowNumber}행: 데이터 형식이 올바르지 않습니다.`);
      }
    }

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
