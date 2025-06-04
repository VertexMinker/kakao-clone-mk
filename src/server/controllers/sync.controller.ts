import { Request, Response } from 'express';
import { prisma } from '../index';

// 오프라인 모드에서 저장된 작업을 동기화하는 API
export const syncOfflineActions = async (req: Request, res: Response) => {
  try {
    const { actions } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.',
      });
    }

    if (!Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '동기화할 작업이 없습니다.',
      });
    }

    const results = [];
    const errors = [];

    // 각 작업을 순차적으로 처리
    for (const action of actions) {
      try {
        const { type, data, timestamp } = action;

        switch (type) {
          case 'ADJUST_INVENTORY': {
            const { productId, quantity, memo } = data;

            // 제품 존재 확인
            const product = await prisma.product.findUnique({
              where: { id: productId },
            });

            if (!product) {
              errors.push({
                action,
                error: `제품 ID ${productId}를 찾을 수 없습니다.`,
              });
              continue;
            }

            const adjustmentQuantity = parseInt(quantity);
            const newQuantity = product.quantity + adjustmentQuantity;

            if (newQuantity < 0) {
              errors.push({
                action,
                error: '재고가 부족합니다.',
              });
              continue;
            }

            // 트랜잭션으로 재고 조정 및 이력 생성
            const [updatedProduct, adjustment] = await prisma.$transaction([
              prisma.product.update({
                where: { id: productId },
                data: { quantity: newQuantity },
              }),
              prisma.inventoryAdjustment.create({
                data: {
                  productId,
                  userId,
                  quantity: adjustmentQuantity,
                  memo,
                  createdAt: new Date(timestamp),
                },
              }),
            ]);

            results.push({
              type,
              data: { product: updatedProduct, adjustment },
              success: true,
            });
            break;
          }

          case 'MOVE_LOCATION': {
            const { productId, toLocation } = data;

            // 제품 존재 확인
            const product = await prisma.product.findUnique({
              where: { id: productId },
            });

            if (!product) {
              errors.push({
                action,
                error: `제품 ID ${productId}를 찾을 수 없습니다.`,
              });
              continue;
            }

            const fromLocation = product.location;

            // 위치가 같으면 변경 불필요
            if (fromLocation === toLocation) {
              errors.push({
                action,
                error: '현재 위치와 동일합니다.',
              });
              continue;
            }

            // 트랜잭션으로 위치 변경 및 이력 생성
            const [updatedProduct, locationHistory] = await prisma.$transaction(
              [
                prisma.product.update({
                  where: { id: productId },
                  data: { location: toLocation },
                }),
                prisma.locationHistory.create({
                  data: {
                    productId,
                    userId,
                    fromLocation,
                    toLocation,
                    movedAt: new Date(timestamp),
                  },
                }),
              ],
            );

            results.push({
              type,
              data: { product: updatedProduct, locationHistory },
              success: true,
            });
            break;
          }

          default:
            errors.push({
              action,
              error: `알 수 없는 작업 유형: ${type}`,
            });
        }
      } catch (error) {
        console.error('작업 처리 오류:', error);
        errors.push({
          action,
          error: '작업 처리 중 오류가 발생했습니다.',
        });
      }
    }

    return res.status(200).json({
      status: 'success',
      data: {
        successCount: results.length,
        errorCount: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('오프라인 동기화 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '오프라인 작업을 동기화하는 중 오류가 발생했습니다.',
    });
  }
};
