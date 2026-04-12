import { DealRepository } from '../repositories/dealRepository';
import { AppError } from '../middleware/errorHandler';
import { Deal } from '../types';

export class DealService {
  private dealRepository: DealRepository;

  constructor() {
    this.dealRepository = new DealRepository();
  }

  async getAllDeals(page: number = 1, limit: number = 100, search?: string, servicerId?: number) {
    try {
      if (search) {
        return await this.dealRepository.searchDeals(search, page, limit);
      } else if (servicerId) {
        const deals = await this.dealRepository.getDealsByServicerId(servicerId);
        return { deals, total: deals.length };
      } else {
        // If limit is 0, fetch all deals
        return await this.dealRepository.getAllDeals(page, limit);
      }
    } catch (error) {
      throw new AppError('Failed to fetch deals', 500);
    }
  }

  async getDealById(id: number): Promise<Deal | null> {
    if (!id || id < 1) {
      throw new AppError('Invalid deal ID', 400);
    }

    try {
      const deal = await this.dealRepository.getDealById(id);
      if (!deal) {
        throw new AppError('Deal not found', 404);
      }
      return deal;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch deal', 500);
    }
  }

  async createDeal(dealData: Partial<Deal>): Promise<Deal> {
    // Validate business rules
    await this.validateDealData(dealData);
    
    // Check for duplicates
    try {
      const existingDeals = await this.dealRepository.searchDeals(dealData.deal_name!);
      const duplicateExists = existingDeals.deals.some(
        deal => deal.keyword.toLowerCase() === dealData.keyword!.toLowerCase()
      );
      
      if (duplicateExists) {
        throw new AppError('Deal with this name and keyword combination already exists', 409);
      }

      const dealId = await this.dealRepository.createDeal(dealData as Deal);
      const createdDeal = await this.dealRepository.getDealById(dealId);
      
      if (!createdDeal) {
        throw new AppError('Failed to create deal', 500);
      }

      return createdDeal;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create deal', 500);
    }
  }

  async updateDeal(id: number, dealData: Partial<Deal>): Promise<Deal> {
    if (!id || id < 1) {
      throw new AppError('Invalid deal ID', 400);
    }

    // Validate business rules
    await this.validateDealData(dealData);

    try {
      // Check if deal exists
      const existingDeal = await this.dealRepository.getDealById(id);
      if (!existingDeal) {
        throw new AppError('Deal not found', 404);
      }

      // Check for duplicates (excluding current deal)
      if (dealData.deal_name && dealData.keyword) {
        const existingDeals = await this.dealRepository.searchDeals(dealData.deal_name);
        const duplicateExists = existingDeals.deals.some(
          deal => deal.id !== id && deal.keyword.toLowerCase() === dealData.keyword!.toLowerCase()
        );
        
        if (duplicateExists) {
          throw new AppError('Deal with this name and keyword combination already exists', 409);
        }
      }

      const updated = await this.dealRepository.updateDeal(id, dealData as Deal);
      if (!updated) {
        throw new AppError('Failed to update deal', 500);
      }

      const updatedDeal = await this.dealRepository.getDealById(id);
      return updatedDeal!;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update deal', 500);
    }
  }

  async deleteDeal(id: number): Promise<void> {
    if (!id || id < 1) {
      throw new AppError('Invalid deal ID', 400);
    }

    try {
      const success = await this.dealRepository.deleteDeal(id);
      if (!success) {
        throw new AppError('Deal not found', 404);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete deal', 500);
    }
  }

  async getStats(): Promise<{ totalDeals: number; uniqueServicers: number; topKeywords: Array<{ keyword: string; count: number }> }> {
    try {
      const stats = await this.dealRepository.getDealStats();
      return stats;
    } catch (error) {
      throw new AppError('Failed to fetch deal statistics', 500);
    }
  }

  private async validateDealData(dealData: Partial<Deal>): Promise<void> {
    if (!dealData.deal_name?.trim()) {
      throw new AppError('Deal name is required', 400);
    }

    if (!dealData.keyword?.trim()) {
      throw new AppError('Keyword is required', 400);
    }

    if (!dealData.servicer_id || dealData.servicer_id < 1) {
      throw new AppError('Valid servicer ID is required', 400);
    }
  }
} 