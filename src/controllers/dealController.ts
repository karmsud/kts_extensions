import { Request, Response, NextFunction } from 'express';
import { DealService } from '../services/dealService';
import { CSVImporterService } from '../services/csvImporter';
import { ApiResponse, Deal } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import fs from 'fs/promises';

export class DealController {
  private dealService: DealService;
  private csvImporter: CSVImporterService;

  constructor() {
    this.dealService = new DealService();
    this.csvImporter = new CSVImporterService();
  }

  // GET /api/v1/deals
  getAllDeals = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Support ?all=true or ?limit=0 to fetch all deals
    const all = req.query.all === 'true' || req.query.limit === '0';
    const page = all ? 1 : (parseInt(req.query.page as string) || 1);
    const limit = all ? 0 : (parseInt(req.query.limit as string) || 100);
    const search = req.query.search as string;
    const servicerId = req.query.servicerId ? parseInt(req.query.servicerId as string) : undefined;

    const result = await this.dealService.getAllDeals(page, limit, search, servicerId);

    const response: ApiResponse<Deal[]> = {
      success: true,
      data: result.deals,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: limit ? Math.ceil(result.total / limit) : 1
      }
    };

    res.json(response);
  });

  // GET /api/v1/deals/:id
  getDealById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    
    const deal = await this.dealService.getDealById(id);

    const response: ApiResponse<Deal> = {
      success: true,
      data: deal!
    };
    res.json(response);
  });

  // POST /api/v1/deals
  createDeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dealData: Deal = req.body;

    const createdDeal = await this.dealService.createDeal(dealData);

    const response: ApiResponse<Deal> = {
      success: true,
      data: createdDeal,
      message: 'Deal created successfully'
    };
    res.status(201).json(response);
  });

  // PUT /api/v1/deals/:id
  updateDeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    const dealData: Deal = req.body;

    const updatedDeal = await this.dealService.updateDeal(id, dealData);

    const response: ApiResponse<Deal> = {
      success: true,
      data: updatedDeal,
      message: 'Deal updated successfully'
    };
    res.json(response);
  });

  // DELETE /api/v1/deals/:id
  deleteDeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);

    await this.dealService.deleteDeal(id);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Deal deleted successfully'
    };
    res.json(response);
  });

  // POST /api/v1/deals/import-csv
  importFromCSV = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }

    try {
      const csvContent = await fs.readFile(req.file.path, 'utf-8');
      const result = await this.csvImporter.importDealsFromCSV(csvContent, false);

      // Clean up the uploaded file
      await fs.unlink(req.file.path);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: `Import completed: ${result.imported} deals imported, ${result.skipped} skipped`
      };
      res.json(response);
    } catch (error) {
      // Clean up the uploaded file in case of error
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      throw error; // Let the asyncHandler handle the error
    }
  });

  // GET /api/v1/deals/stats
  getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const stats = await this.dealService.getStats();

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats
    };
    res.json(response);
  });
} 