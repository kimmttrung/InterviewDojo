// src/modules/admin/wallet-admin/wallet-admin.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { WalletAdminService } from './wallet-admin.service';
import { AdminTransactionQueryDto } from './dto/admin-transaction-query.dto';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Messages } from '@/common/constants/messages.constant';

@Controller('admin/wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class WalletAdminController {
  constructor(private readonly walletAdminService: WalletAdminService) {}

  /**
   * Danh sách tất cả giao dịch toàn hệ thống.
   * Filter: type, search (email/name/referenceId), startDate, endDate, page, limit.
   */
  @Get('transactions')
  @ResponseMessage(Messages.WALLET.TRANSACTIONS_FETCHED)
  getTransactions(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: AdminTransactionQueryDto,
  ) {
    return this.walletAdminService.getAllTransactions(query);
  }

  /**
   * Thống kê ví: tổng nạp, phí nền tảng, credit lưu hành, top users, adjustments gần đây.
   */
  @Get('statistics')
  @ResponseMessage(Messages.WALLET.STATISTICS_FETCHED)
  getStatistics() {
    return this.walletAdminService.getWalletStatistics();
  }

  /**
   * Điều chỉnh số dư thủ công — ghi ADMIN_ADJUSTMENT transaction.
   * amount dương = cộng, âm = trừ.
   */
  @Post('adjust/:userId')
  @ResponseMessage(Messages.WALLET.ADMIN_ADJUSTED)
  adjustBalance(
    @Param('userId', ParseIntPipe) userId: number,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: AdjustBalanceDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.walletAdminService.adminAdjustBalance(
      userId,
      dto.amount,
      `${dto.note} (admin: ${admin.sub})`,
      admin.sub,
    );
  }
}
