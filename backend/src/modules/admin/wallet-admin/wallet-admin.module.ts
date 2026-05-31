// src/modules/admin/wallet-admin/wallet-admin.module.ts
import { Module } from '@nestjs/common';
import { WalletAdminController } from './wallet-admin.controller';
import { WalletAdminService } from './wallet-admin.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WalletAdminController],
  providers: [WalletAdminService],
  exports: [WalletAdminService],
})
export class WalletAdminModule {}
