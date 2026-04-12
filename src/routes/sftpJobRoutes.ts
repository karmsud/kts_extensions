import { Router } from 'express';
import { SftpJobController } from '../controllers/sftpJobController';

const router = Router();
const sftpJobController = new SftpJobController();

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
    
    res.json = function(obj: any) {
      clearTimeout(timeout);
      return originalJson.call(this, obj);
    };

    next();
  };
};

// Apply timeout middleware to all routes
router.use(withTimeout(30000));

// SFTP Job CRUD routes
router.get('/', (req, res, next) => sftpJobController.getAllSftpJobs(req, res, next));
router.get('/:id', (req, res, next) => sftpJobController.getSftpJobById(req, res, next));
router.post('/', (req, res, next) => sftpJobController.createSftpJob(req, res, next));
router.put('/:id', (req, res, next) => sftpJobController.updateSftpJob(req, res, next));
router.delete('/:id', (req, res, next) => sftpJobController.deleteSftpJob(req, res, next));

// Additional SFTP job operations
router.post('/:id/clone', (req, res, next) => sftpJobController.cloneSftpJob(req, res, next));

// Load SFTP jobs from XML file
router.post('/load-from-xml', (req, res) => sftpJobController.loadFromXmlFile(req, res));
router.get('/:id/xml-preview', (req, res, next) => sftpJobController.getSftpJobXmlPreview(req, res, next));

// Master script generation
router.post('/generate-master-script', (req, res) => sftpJobController.generateMasterScript(req, res));

export default router;
