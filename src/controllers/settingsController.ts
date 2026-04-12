import { Request, Response } from 'express';
import Database from '../config/database';

export const getSettings = async (req: Request, res: Response) => {
  const db = Database.getInstance().getDb();
  try {
    const settings = db.prepare('SELECT * FROM frp_settings LIMIT 1').get() as any;
    res.json(settings || {
      emailNotifications: true,
      defaultJobStatus: 'active',
      loggingLevel: 'info',
      retentionPeriod: 30,
      smtpServer: '',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  const settings = req.body;
  const db = Database.getInstance().getDb();
  try {
    const requiredFields = ['emailNotifications','defaultJobStatus','loggingLevel','retentionPeriod','smtpServer','smtpPort','smtpUsername','smtpPassword'];
    for (const field of requiredFields) {
      if (settings[field] === undefined) return res.status(400).json({ error: `Missing required field: ${field}` });
    }
    const existing = db.prepare('SELECT id FROM frp_settings LIMIT 1').get() as any;
    if (!existing) {
      db.prepare(
        `INSERT INTO frp_settings (setting_key, setting_value) VALUES ('config', ?)`
      ).run(JSON.stringify(settings));
    } else {
      db.prepare('UPDATE frp_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(JSON.stringify(settings), existing.id);
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}; 