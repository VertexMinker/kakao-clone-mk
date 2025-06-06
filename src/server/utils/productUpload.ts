import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { ProductFormData } from '../../types/product';

export async function parseXlsxFile(
  filePath: string,
): Promise<Record<string, unknown>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  const headers = (worksheet.getRow(1).values as string[]).slice(1);
  const rows: Record<string, unknown>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowValues = row.values as any[];
    const data: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      data[String(header)] = rowValues[index + 1];
    });
    rows.push(data);
  });
  return rows;
}

export async function parseCsvFile(
  filePath: string,
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const results: Record<string, unknown>[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

export function validateProducts(products: Record<string, unknown>[]): {
  validProducts: ProductFormData[];
  errors: string[];
} {
  const validProducts: ProductFormData[] = [];
  const errors: string[] = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const rowNumber = i + 2; // header row is 1
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
    try {
      validProducts.push({
        name: String(product.name),
        sku: String(product.sku),
        category: String(product.category),
        brand: String(product.brand),
        location: String(product.location),
        quantity: parseInt(String(product.quantity)),
        safetyStock: parseInt(String(product.safetyStock)),
        price: parseFloat(String(product.price)),
      });
    } catch {
      errors.push(`${rowNumber}행: 데이터 형식이 올바르지 않습니다.`);
    }
  }

  return { validProducts, errors };
}
