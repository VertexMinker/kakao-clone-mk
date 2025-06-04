import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { syncOfflineActions } from '../controllers/sync.controller';

const router = express.Router();

router.post('/sync', authenticate, syncOfflineActions);

export default router;
