import { Module } from '@nestjs/common';
import { WalletAdminController } from './wallet-admin.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { WalletModule } from '../../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [WalletAdminController],
})
export class WalletAdminModule {}
