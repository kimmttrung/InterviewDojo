import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyWallet(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        creditBalance: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      creditBalance: user.creditBalance,
    };
  }
}
