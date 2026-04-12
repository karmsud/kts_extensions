import express from 'express';
import jobRoutes from './jobRoutes';
import dealRoutes from './dealRoutes';
import settingsRoutes from './settingsRoutes';
import servicerRoutes from './servicerRoutes';
import outlookScriptRoutes from './outlookScriptRoutes';
import sftpJobRoutes from './sftpJobRoutes';

const router = express.Router();

router.use('/jobs', jobRoutes);
router.use('/sftp-jobs', sftpJobRoutes);
router.use('/deals', dealRoutes);
router.use('/settings', settingsRoutes);
router.use('/servicers', servicerRoutes);
router.use('/outlook-script', outlookScriptRoutes);

// Test route directly in index
router.get('/outlook-script-direct-test', (req, res) => {
  res.json({ success: true, message: 'Direct test working!' });
});

export default router;
