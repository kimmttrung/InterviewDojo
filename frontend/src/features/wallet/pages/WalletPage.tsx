import { Wallet, Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

import { Layout } from '@/shared/components/layout/Layout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

import { useWallet } from '../hooks/useWallet';

export default function WalletPage() {
  const { data, isLoading } = useWallet();

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ví Credits</h1>
          <p className="text-muted-foreground mt-1">Quản lý số dư và giao dịch của bạn</p>
        </div>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/80">Số dư hiện tại</p>

                <h2 className="mt-2 text-5xl font-bold">{data?.creditBalance ?? 0}</h2>

                <p className="mt-2 text-white/80">Credits</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <Wallet className="h-10 w-10" />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button className="bg-white text-black hover:bg-white/90">
                <Plus className="mr-2 h-4 w-4" />
                Nạp Credits
              </Button>

              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                Lịch sử giao dịch
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Giao dịch gần đây</h3>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-100 p-2">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="font-medium">Thanh toán booking mock interview</p>

                    <p className="text-sm text-muted-foreground">Hôm nay</p>
                  </div>
                </div>

                <span className="font-semibold text-red-500">-100</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <ArrowDownLeft className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="font-medium">Nạp credits</p>

                    <p className="text-sm text-muted-foreground">2 ngày trước</p>
                  </div>
                </div>

                <span className="font-semibold text-green-600">+500</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
