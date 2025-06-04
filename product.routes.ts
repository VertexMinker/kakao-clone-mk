import express from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustInventory,
  moveProductLocation,
  getLocationHistory,
  exportProducts
} from '../controllers/product.controller';
import { bulkUploadProducts } from '../controllers/upload.controller';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// 제품 조회 및 검색
router.get('/', authenticate, getAllProducts);
router.get('/export', authenticate, exportProducts);
router.get('/:id', authenticate, getProductById);
router.get('/:id/location-history', authenticate, getLocationHistory);

// 제품 생성, 수정, 삭제 (관리자 권한 필요)
router.post('/', authenticate, authorizeAdmin, createProduct);
router.put('/:id', authenticate, authorizeAdmin, updateProduct);
router.delete('/:id', authenticate, authorizeAdmin, deleteProduct);

// 재고 조정 및 위치 변경
router.post('/:id/adjust', authenticate, adjustInventory);
router.post('/:id/move', authenticate, moveProductLocation);

// 대량 업로드
router.post('/bulk-upload', authenticate, authorizeAdmin, upload.single('file'), bulkUploadProducts);

export default router;
