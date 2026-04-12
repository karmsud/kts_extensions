import { Router } from 'express';
import { getJobs, getJobById, createJob, updateJob, deleteJob, importJobs, getXmlPreview } from '../controllers/jobController';
import { getJobConfig, updateJobConfig, saveDraftConfig, commitConfig } from '../controllers/jobConfigController';
import { upload } from '../middleware/upload';

const router = Router();

// Timeout middleware for API routes
const withTimeout = (timeoutMs: number = 30000) => {
  return (req: any, res: any, next: any) => {
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

// Job CRUD routes
router.get('/', getJobs);
router.get('/:id', getJobById);
router.get('/:id/xml-preview', getXmlPreview);
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

// Job configuration routes
router.get('/:id/config', getJobConfig);
router.put('/:id/config', updateJobConfig);
router.post('/:id/config/draft', saveDraftConfig);
router.post('/:id/config/commit', commitConfig);

// Import route
router.post('/import', upload.single('file'), importJobs);

export default router; 