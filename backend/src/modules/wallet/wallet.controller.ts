// src/modules/wallet/wallet.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { WalletService } from './wallet.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

import { TransactionQueryDto } from './dto/transaction-query.dto';

import { ResponseMessage } from '../../common/decorators/response-message.decorator';

import { Messages } from '../../common/constants/messages.constant';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  @ResponseMessage(Messages.WALLET.FETCHED)
  async getMyWallet(@CurrentUser() user: JwtPayload) {
    return this.walletService.getMyWallet(Number(user.sub));
  }

  @Get('transactions')
  @ResponseMessage(Messages.WALLET.TRANSACTIONS_FETCHED)
  async getMyTransactions(
    @CurrentUser() user: JwtPayload,

    @Query()
    query: TransactionQueryDto,
  ) {
    return this.walletService.getMyTransactions(Number(user.sub), query);
  }
}
