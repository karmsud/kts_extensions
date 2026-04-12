import express from 'express';
import { DealController } from '../controllers/dealController';
import { OptimizedDealController } from '../controllers/optimizedDealController';
import { uploadCSV } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiting';
import { dealValidation, validateId } from '../middleware/validation';

const router = express.Router();
const dealController = new DealController();
const optimizedDealController = new OptimizedDealController();

// Timeout middleware for API routes
const withTimeout = (timeoutMs: number = 30000) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout',
          message: `Request took longer than ${timeoutMs}ms to complete`,
          timestamp: new Date().toISOString()
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(body: any) {
      clearTimeout(timeout);
      return originalSend.call(this, body);
    };
    
    res.json = function(body: any) {
      clearTimeout(timeout);
      return originalJson.call(this, body);
    };

    next();
  };
};

// Apply timeout to all routes
router.use(withTimeout(30000)); // 30 second timeout

// GET /api/v1/deals/optimized - Get deals with job names optimized
router.get('/optimized', optimizedDealController.getDealsWithJobNames);

// POST /api/v1/deals/cache/clear - Clear cache
router.post('/cache/clear', optimizedDealController.clearCache);

// GET /api/v1/deals - Get all deals with pagination and search
router.get('/', optimizedDealController.getAllDeals); // Use optimized controller

// GET /api/v1/deals/stats - Get deal statistics
router.get('/stats', dealController.getStats);

// GET /api/v1/deals/:id - Get deal by ID
router.get('/:id', validateId, dealController.getDealById);

// POST /api/v1/deals - Create new deal
router.post('/', dealValidation, dealController.createDeal);

// PUT /api/v1/deals/:id - Update deal
router.put('/:id', validateId, dealValidation, dealController.updateDeal);

// DELETE /api/v1/deals/:id - Delete deal
router.delete('/:id', validateId, dealController.deleteDeal);

// POST /api/v1/deals/import-csv - Import deals from CSV
router.post(
  '/import-csv',
  uploadLimiter,
  uploadCSV,
  dealController.importFromCSV
);

export default router;
