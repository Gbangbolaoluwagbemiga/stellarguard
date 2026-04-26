import { Controller, Get, Param, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
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

@ApiTags('treasury')
@Controller('api/treasury')
@Public()
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get treasury balance' })
  @ApiResponse({ status: 200, description: 'Returns current treasury balance' })
  async getBalance() {
    const balance = await this.treasuryService.getBalance();
    return { balance };
  }

  @Get('config')
  @ApiOperation({ summary: 'Get treasury configuration' })
  @ApiResponse({ status: 200, description: 'Returns treasury configuration' })
  async getConfig() {
    return this.treasuryService.getConfig();
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get treasury transactions with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of transactions' })
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
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Returns transaction details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransaction(@Param('id') id: string) {
    const tx = await this.treasuryService.getTransactionById(id);
    if (!tx) throw new NotFoundException(`Transaction with ID ${id} not found`);
    return tx;
  }

  @Get('signers')
  @ApiOperation({ summary: 'Get treasury signers' })
  @ApiResponse({ status: 200, description: 'Returns list of authorized signers' })
  async getSigners() {
    const signers = await this.treasuryService.getSigners();
    return { signers };
  }
}
