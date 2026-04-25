import { Controller, Get, Param, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { TreasuryService } from './treasury.service';

const paginationSchema = z.object({
  page: z
    .string()
    .default('1')
    .pipe(z.coerce.number().int().min(1, 'Page must be 1 or greater')),
  limit: z
    .string()
    .default('10')
    .pipe(z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100')),
});

@Controller('api/treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('balance')
  async getBalance() {
    const balance = await this.treasuryService.getBalance();
    return { balance };
  }

  @Get('config')
  async getConfig() {
    return this.treasuryService.getConfig();
  }

  @Get('transactions')
  async getTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const result = paginationSchema.safeParse({ page, limit });
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw new BadRequestException(`Invalid pagination parameters: ${errors}`);
    }
    return this.treasuryService.getTransactions(result.data.page, result.data.limit);
  }

  @Get('transactions/:id')
  async getTransaction(@Param('id') id: string) {
    const tx = await this.treasuryService.getTransactionById(id);
    if (!tx) throw new NotFoundException(`Transaction with ID ${id} not found`);
    return tx;
  }

  @Get('signers')
  async getSigners() {
    const signers = await this.treasuryService.getSigners();
    return { signers };
  }
}
