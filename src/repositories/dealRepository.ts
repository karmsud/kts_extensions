import Database from '../config/database';
import { Deal } from '../types';

export class DealRepository {
  private get db() { return Database.getInstance().getDb(); }

  getAllDeals(page: number = 1, limit: number = 100, servicerId?: number): { deals: Deal[], total: number } {
    let whereClause = '';
    const params: any[] = [];

    if (servicerId !== undefined) {
      whereClause = 'WHERE servicer_id = ?';
      params.push(servicerId);
    }

    const total = (this.db.prepare(`SELECT COUNT(*) as count FROM frp_deals ${whereClause}`).get(...params) as any).count;

    let deals: Deal[];
    if (!limit || limit === 0) {
      deals = this.db.prepare(`SELECT * FROM frp_deals ${whereClause} ORDER BY id DESC`).all(...params) as Deal[];
    } else {
      const offset = (page - 1) * limit;
      deals = this.db.prepare(
        `SELECT * FROM frp_deals ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`
      ).all(...params, limit, offset) as Deal[];
    }

    return { deals, total };
  }

  getDealById(id: number): Deal | null {
    return (this.db.prepare('SELECT * FROM frp_deals WHERE id = ?').get(id) as Deal) ?? null;
  }

  getDealsByServicerId(servicerId: number): Deal[] {
    return this.db.prepare('SELECT * FROM frp_deals WHERE servicer_id = ? ORDER BY deal_name ASC').all(servicerId) as Deal[];
  }

  createDeal(deal: Deal): number {
    const result = this.db.prepare(
      'INSERT INTO frp_deals (item_id, deal_name, keyword, servicer_id) VALUES (?, ?, ?, ?)'
    ).run(deal.item_id ?? null, deal.deal_name, deal.keyword, deal.servicer_id ?? null);
    return Number(result.lastInsertRowid);
  }

  updateDeal(id: number, deal: Deal): boolean {
    const result = this.db.prepare(
      'UPDATE frp_deals SET item_id = ?, deal_name = ?, keyword = ?, servicer_id = ? WHERE id = ?'
    ).run(deal.item_id ?? null, deal.deal_name, deal.keyword, deal.servicer_id ?? null, id);
    return result.changes > 0;
  }

  deleteDeal(id: number): boolean {
    const result = this.db.prepare('DELETE FROM frp_deals WHERE id = ?').run(id);
    return result.changes > 0;
  }

  searchDeals(searchTerm: string, page: number = 1, limit: number = 100, servicerId?: number): { deals: Deal[], total: number } {
    const searchPattern = `%${searchTerm}%`;
    let whereClause = `WHERE deal_name LIKE ? OR keyword LIKE ? OR CAST(servicer_id AS TEXT) LIKE ?`;
    const baseParams: any[] = [searchPattern, searchPattern, searchPattern];

    if (servicerId !== undefined) {
      whereClause += ` AND servicer_id = ?`;
      baseParams.push(servicerId);
    }

    const total = (this.db.prepare(`SELECT COUNT(*) as count FROM frp_deals ${whereClause}`).get(...baseParams) as any).count;

    let deals: Deal[];
    if (!limit || limit === 0) {
      deals = this.db.prepare(`SELECT * FROM frp_deals ${whereClause} ORDER BY deal_name ASC`).all(...baseParams) as Deal[];
    } else {
      const offset = (page - 1) * limit;
      deals = this.db.prepare(
        `SELECT * FROM frp_deals ${whereClause} ORDER BY deal_name ASC LIMIT ? OFFSET ?`
      ).all(...baseParams, limit, offset) as Deal[];
    }

    return { deals, total };
  }

  bulkCreateDeals(deals: Deal[]): { imported: number, skipped: number, errors: string[] } {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    const checkStmt = this.db.prepare('SELECT id FROM frp_deals WHERE deal_name = ? AND keyword = ? AND servicer_id = ?');
    const insertStmt = this.db.prepare(
      'INSERT INTO frp_deals (item_id, deal_name, keyword, servicer_id) VALUES (?, ?, ?, ?)'
    );

    const runBulk = this.db.transaction((deals: Deal[]) => {
      for (const deal of deals) {
        try {
          const existing = checkStmt.get(deal.deal_name, deal.keyword, deal.servicer_id ?? null);
          if (existing) { skipped++; continue; }
          insertStmt.run(deal.item_id ?? null, deal.deal_name, deal.keyword, deal.servicer_id ?? null);
          imported++;
        } catch (error) {
          errors.push(`Failed to import deal "${deal.deal_name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    });

    runBulk(deals);
    return { imported, skipped, errors };
  }

  getUniqueServicerIds(): number[] {
    const rows = this.db.prepare('SELECT DISTINCT servicer_id FROM frp_deals WHERE servicer_id IS NOT NULL ORDER BY servicer_id ASC').all() as any[];
    return rows.map(r => r.servicer_id);
  }

  getDealStats(): { totalDeals: number, uniqueServicers: number, topKeywords: Array<{ keyword: string, count: number }> } {
    const totalDeals = (this.db.prepare('SELECT COUNT(*) as count FROM frp_deals').get() as any).count;
    const uniqueServicers = (this.db.prepare('SELECT COUNT(DISTINCT servicer_id) as count FROM frp_deals').get() as any).count;
    const topKeywords = this.db.prepare(
      'SELECT keyword, COUNT(*) as count FROM frp_deals GROUP BY keyword ORDER BY count DESC LIMIT 10'
    ).all() as Array<{ keyword: string, count: number }>;

    return { totalDeals, uniqueServicers, topKeywords };
  }
}