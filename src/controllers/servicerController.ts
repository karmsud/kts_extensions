import { Request, Response } from 'express';
import Database from '../config/database';

export const getServicers = async (req: Request, res: Response) => {
  const db = Database.getInstance().getDb();
  try {
    const servicers = db.prepare('SELECT id, name FROM frp_servicers ORDER BY name').all();
    res.json(servicers);
  } catch (error) {
    console.error('Error fetching servicers:', error);
    res.status(500).json({ error: 'Failed to fetch servicers' });
  }
}; 