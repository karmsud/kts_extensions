import { Request, Response } from 'express';
import { OptimizedDealService, DealWithJobNames } from '../services/optimizedDealService';
import { ApiResponse, Deal } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export class OptimizedDealController {
  private optimizedDealService: OptimizedDealService;

  constructor() {
    this.optimizedDealService = new OptimizedDealService();
  }

  // GET /api/v1/deals/optimized - Get deals with job names in single call
  getDealsWithJobNames = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const all = req.query.all === 'true' || req.query.limit === '0';
    const page = all ? 1 : (parseInt(req.query.page as string) || 1);
    const limit = all ? 0 : (parseInt(req.query.limit as string) || 100);
    const search = req.query.search as string;
    const servicerId = req.query.servicerId ? parseInt(req.query.servicerId as string) : undefined;

    logger.info('Fetching deals with job names', { page, limit, search, servicerId });

    const result = await this.optimizedDealService.getDealsWithJobNames(page, limit, search, servicerId);

    const response: ApiResponse<DealWithJobNames[]> = {
      success: true,
      data: result.deals,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: limit ? Math.ceil(result.total / limit) : 1
      },
      metadata: {
        jobsCount: result.jobs.length,
        fetchedAt: new Date().toISOString()
      }
    };

    res.json(response);
  });

  // GET /api/v1/deals - Original endpoint with optimization
  getAllDeals = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const all = req.query.all === 'true' || req.query.limit === '0';
    const page = all ? 1 : (parseInt(req.query.page as string) || 1);
    const limit = all ? 0 : (parseInt(req.query.limit as string) || 100);
    const search = req.query.search as string;
    const servicerId = req.query.servicerId ? parseInt(req.query.servicerId as string) : undefined;

    // Use optimized service for better performance
    const result = await this.optimizedDealService.getDealsWithJobNames(page, limit, search, servicerId);

    const response: ApiResponse<DealWithJobNames[]> = {
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
    
    if (isNaN(id)) {
      throw new ValidationError('Invalid deal ID');
    }

    const deal = await this.optimizedDealService.getDealWithJobNames(id);

    if (!deal) {
      throw new AppError('Deal not found', 404);
    }

    const response: ApiResponse<DealWithJobNames> = {
      success: true,
      data: deal
    };
    res.json(response);
  });

  // POST /api/v1/deals
  createDeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dealData: Deal = req.body;

    // Basic validation
    if (!dealData.deal_name || !dealData.keyword || !dealData.servicer_id) {
      throw new ValidationError('Missing required fields: deal_name, keyword, servicer_id');
    }

    const createdDeal = await this.optimizedDealService.createDeal(dealData);

    const response: ApiResponse<DealWithJobNames> = {
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

    if (isNaN(id)) {
      throw new ValidationError('Invalid deal ID');
    }

    // Basic validation
    if (!dealData.deal_name || !dealData.keyword || !dealData.servicer_id) {
      throw new ValidationError('Missing required fields: deal_name, keyword, servicer_id');
    }

    const updatedDeal = await this.optimizedDealService.updateDeal(id, dealData);

    const response: ApiResponse<DealWithJobNames> = {
      success: true,
      data: updatedDeal,
      message: 'Deal updated successfully'
    };
    res.json(response);
  });

  // DELETE /api/v1/deals/:id
  deleteDeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new ValidationError('Invalid deal ID');
    }

    await this.optimizedDealService.deleteDeal(id);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Deal deleted successfully'
    };
    res.json(response);
  });

  // POST /api/v1/deals/cache/clear - Clear cache manually
  clearCache = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.optimizedDealService.clearCache();

    const response: ApiResponse<null> = {
      success: true,
      message: 'Cache cleared successfully'
    };
    res.json(response);
  });
}
