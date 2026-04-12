import * as fs from 'fs-extra';
import { Deal } from '../types';
import { DealRepository } from '../repositories/dealRepository';

export class CSVImporterService {
  private dealRepository: DealRepository;

  constructor() {
    this.dealRepository = new DealRepository();
  }

  async importDealsFromCSV(input: string, isFilePath: boolean = true): Promise<{ imported: number, skipped: number, errors: string[] }> {
    try {
      let csvContent: string;
      
      if (isFilePath) {
        if (!await fs.pathExists(input)) {
          throw new Error(`CSV file not found: ${input}`);
        }
        csvContent = await fs.readFile(input, 'utf-8');
      } else {
        csvContent = input;
      }

      const lines = csvContent.split('\n').filter(line => line.trim());
      console.log(`Total lines in CSV (including header): ${lines.length}`);

      if (lines.length < 2) {
        throw new Error('CSV file appears to be empty or missing data');
      }

      // Skip header row
      const dataLines = lines.slice(1);
      const deals: Deal[] = [];
      const errors: string[] = [];
      let skipped = 0;

      for (let i = 0; i < dataLines.length; i++) {
        const lineNumber = i + 2; // +2 because we skipped header and arrays are 0-indexed
        
        try {
          const deal = this.parseCSVLine(dataLines[i], lineNumber);
          if (deal) {
            deals.push(deal);
          } else {
            console.log(`Skipping empty line ${lineNumber}`);
            skipped++;
          }
        } catch (error) {
          console.error(`Error parsing line ${lineNumber}:`, error);
          errors.push(`Line ${lineNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          skipped++;
        }
      }

      console.log(`Parsed ${deals.length} valid deals, skipped ${skipped} invalid lines`);

      // Import deals in batches
      let imported = 0;
      if (deals.length > 0) {
        try {
          const result = await this.dealRepository.bulkCreateDeals(deals);
          imported = result.imported;
          skipped += result.skipped;
          errors.push(...result.errors);
          console.log(`Successfully imported ${imported} deals, skipped ${skipped} total (${result.skipped} existing, ${skipped - result.skipped} invalid)`);
        } catch (error) {
          console.error('Bulk import failed:', error);
          errors.push(`Bulk import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (errors.length > 0) {
        console.log('Import errors:', errors);
      }

      return { imported, skipped, errors };

    } catch (error) {
      console.error('CSV import failed:', error);
      throw new Error(`CSV import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseCSVLine(line: string, lineNumber: number): Deal | null {
    // Remove carriage returns and trim
    const cleanLine = line.replace(/\r/g, '').trim();
    
    if (!cleanLine) {
      console.log(`Line ${lineNumber} is empty after cleaning`);
      return null;
    }

    // Split by comma, but handle quoted values
    const values = this.parseCSVValues(cleanLine);

    if (values.length < 4) {
      throw new Error(`Invalid CSV format - expected 4 columns (ItemID,Deal name,keyword,ServicerID), got ${values.length} columns: ${values.join(', ')}`);
    }

    const [itemIdStr, dealName, keyword, servicerIdStr] = values;

    // Log raw values for debugging
    console.log(`Line ${lineNumber} raw values:`, { itemIdStr, dealName, keyword, servicerIdStr });

    // Validate and parse ItemID
    const itemId = itemIdStr.trim() ? parseInt(itemIdStr.trim()) : undefined;
    if (itemIdStr.trim() && (isNaN(itemId!) || itemId! < 0)) {
      throw new Error(`Invalid ItemID: "${itemIdStr}"`);
    }

    // Validate deal name
    if (!dealName?.trim()) {
      throw new Error('Deal name is required');
    }

    // Validate keyword
    if (!keyword?.trim()) {
      throw new Error('Keyword is required');
    }

    // Validate and parse ServicerID
    const servicerId = parseInt(servicerIdStr?.trim() || '');
    if (isNaN(servicerId) || servicerId < 0) {
      throw new Error(`Invalid ServicerID: "${servicerIdStr}"`);
    }

    return {
      item_id: itemId,
      deal_name: dealName.trim(),
      keyword: keyword.trim(),
      servicer_id: servicerId
    };
  }

  private parseCSVValues(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of value
        values.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last value
    values.push(current);

    return values;
  }

  async exportDealsToCSV(outputPath: string): Promise<void> {
    try {
      const { deals } = await this.dealRepository.getAllDeals(1, 10000); // Get all deals
      
      let csvContent = 'ItemID,Deal name,keyword,ServicerID\n';
      
      for (const deal of deals) {
        const itemId = deal.item_id || '';
        const dealName = this.escapeCSVValue(deal.deal_name);
        const keyword = this.escapeCSVValue(deal.keyword);
        const servicerId = deal.servicer_id;
        
        csvContent += `${itemId},${dealName},${keyword},${servicerId}\n`;
      }

      await fs.writeFile(outputPath, csvContent, 'utf-8');
    } catch (error) {
      throw new Error(`CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // Escape quotes by doubling them and wrap in quotes
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
} 