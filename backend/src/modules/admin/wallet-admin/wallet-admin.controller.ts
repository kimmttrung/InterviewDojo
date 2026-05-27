// src/modules/admin/wallet-admin/wallet-admin.controller.ts
import {
  Controller,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { WalletService } from '../../wallet/wallet.service';
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
  constructor(private readonly walletService: WalletService) {}

  @Post('adjust/:userId')
  @ResponseMessage(Messages.WALLET.ADMIN_ADJUSTED)
  adjustBalance(
    @Param('userId', ParseIntPipe) userId: number,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: AdjustBalanceDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.walletService.adminAdjustBalance(
      userId,
      dto.amount,
      `${dto.note} (admin: ${admin.sub})`,
    );
  }
}
