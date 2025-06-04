import { Product } from '@prisma/client';
import { prisma } from '../index';
import { sendLowStockAlert } from '../utils/email';

/**
 * 제품 위치 변경 서비스
 * @param productId 제품 ID
 * @param userId 사용자 ID
 * @param toLocation 새 위치
 * @returns 업데이트된 제품 및 위치 이력
 */
export const moveProductLocation = async (
  productId: string,
  userId: string,
  toLocation: string
) => {
  // 제품 존재 확인
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });
  
  if (!product) {
    throw new Error('제품을 찾을 수 없습니다.');
  }
  
  const fromLocation = product.location;
  
  // 위치가 같으면 변경 불필요
  if (fromLocation === toLocation) {
    throw new Error('현재 위치와 동일합니다.');
  }
  
  // 트랜잭션으로 위치 변경 및 이력 생성
  const [updatedProduct, locationHistory] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { location: toLocation }
    }),
    prisma.locationHistory.create({
      data: {
        productId,
        userId,
        fromLocation,
        toLocation
      }
    })
  ]);
  
  return {
    product: updatedProduct,
    locationHistory
  };
};

/**
 * 재고 조정 서비스
 * @param productId 제품 ID
 * @param userId 사용자 ID
 * @param quantity 조정 수량 (양수: 입고, 음수: 출고)
 * @param memo 메모
 * @returns 업데이트된 제품 및 재고 조정 이력
 */
export const adjustInventory = async (
  productId: string,
  userId: string,
  quantity: number,
  memo?: string
) => {
  // 제품 존재 확인
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });
  
  if (!product) {
    throw new Error('제품을 찾을 수 없습니다.');
  }
  
  const newQuantity = product.quantity + quantity;
  
  if (newQuantity < 0) {
    throw new Error('재고가 부족합니다.');
  }
  
  // 트랜잭션으로 재고 조정 및 이력 생성
  const [updatedProduct, adjustment] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { quantity: newQuantity }
    }),
    prisma.inventoryAdjustment.create({
      data: {
        productId,
        userId,
        quantity,
        memo
      }
    })
  ]);
  
  // 안전 재고 이하로 떨어졌는지 확인하고 알림 발송
  if (newQuantity <= product.safetyStock) {
    await sendLowStockAlert(product.name, product.sku, newQuantity, product.safetyStock);
  }
  
  return {
    product: updatedProduct,
    adjustment
  };
};
