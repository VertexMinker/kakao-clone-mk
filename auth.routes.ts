import express from 'express';
import { login, refreshToken } from '../controllers/auth.controller';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshToken);

export default router;
