import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logger';

const router = Router();

interface GenerateScriptRequest {
  environment: string;
  content: string;
}

// Generate master outlook script for specified environment
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { environment, content }: GenerateScriptRequest = req.body;

    if (!environment || !content) {
      return res.status(400).json({
        success: false,
        message: 'Environment and content are required'
      });
    }

    // Validate environment
    const validEnvironments = ['DEV', 'IT', 'UAT', 'Prod'];
    if (!validEnvironments.includes(environment)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid environment. Must be one of: ' + validEnvironments.join(', ')
      });
    }

    // Define paths
    const projectRoot = path.resolve(__dirname, '../../');
    const envFolderPath = path.join(projectRoot, 'PS_Scripts', environment);
    const fileName = `outlook_${environment.toLowerCase()}.ps1`;
    const filePath = path.join(envFolderPath, fileName);

    // Ensure environment folder exists
    await fs.mkdir(envFolderPath, { recursive: true });

    // Check if file already exists and create backup with versioning
    let backupCreated = false;
    try {
      await fs.access(filePath);
      // File exists, create backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupFileName = `outlook_${environment.toLowerCase()}_backup_${timestamp}.ps1`;
      const backupPath = path.join(envFolderPath, backupFileName);
      
      await fs.copyFile(filePath, backupPath);
      backupCreated = true;
      logger.info(`Created backup: ${backupFileName}`);
    } catch (error) {
      // File doesn't exist, no backup needed
      logger.info(`No existing file found for ${environment}, creating new file`);
    }

    // Write the new content
    await fs.writeFile(filePath, content, 'utf8');

    const responseMessage = backupCreated 
      ? `Master script generated successfully for ${environment} environment. Previous version backed up.`
      : `Master script generated successfully for ${environment} environment.`;

    logger.info(`Generated outlook script for ${environment} environment: ${filePath}`);

    res.json({
      success: true,
      message: responseMessage,
      data: {
        environment,
        filePath: filePath,
        backupCreated
      }
    });

  } catch (error) {
    logger.error('Error generating outlook script:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate outlook script',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test route
router.get('/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Outlook script routes working!'
  });
});

export default router;
