import express from 'express';
import { getServicers } from '../controllers/servicerController';

const router = express.Router();

router.get('/', getServicers);

export default router; 