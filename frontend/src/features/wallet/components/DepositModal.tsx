// src/features/wallet/components/DepositModal.tsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useDeposit } from '../hooks/useDeposit';
import { paymentApi } from '../api/paymentApi';
import { QRCodeSVG } from 'qrcode.react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [50_000, 100_000, 200_000, 500_000];

export const DepositModal = ({ open, onClose, onSuccess }: DepositModalProps) => {
  const [amount, setAmount] = useState(100_000);
  const [step, setStep] = useState<'form' | 'qr' | 'processing' | 'success'>('form');
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [expiredAt, setExpiredAt] = useState<string | null>(null);
  const depositMutation = useDeposit();

  useEffect(() => {
    if (!open) {
      setStep('form');
      setPaymentId(null);
      setOrderCode(null);
      setExpiredAt(null);
      setAmount(100_000);
    }
  }, [open]);

  const handleSubmit = async () => {
    try {
      // mutationFn đã unwrap đúng → data là DepositResult
      const data = await depositMutation.mutateAsync(amount);
      setPaymentId(data.paymentId);
      setOrderCode(data.orderCode);
      setExpiredAt(data.expiredAt);
      setStep('qr');
    } catch {
      // lỗi đã toast trong useDeposit.onError
    }
  };

  const handleMockSuccess = async () => {
    if (!paymentId) return;
    setStep('processing');
    try {
      await paymentApi.mockSuccess(paymentId);
      setStep('success');
      onSuccess?.();
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error(err);
      setStep('qr');
    }
  };

  const formatVND = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  // QR theo chuẩn VietQR — không cần gọi SePay API
  // VITE_BANK_ACCOUNT_NUMBER = số tài khoản MB Bank của bạn
  const qrContent = orderCode
    ? `https://img.vietqr.io/image/MB-${import.meta.env.VITE_BANK_ACCOUNT_NUMBER}-compact2.png?amount=${amount}&addInfo=${orderCode}&accountName=${encodeURIComponent(import.meta.env.VITE_BANK_ACCOUNT_NAME ?? '')}`
    : '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nạp tiền vào ví</DialogTitle>
          <DialogDescription>Chuyển khoản theo hướng dẫn để nạp credits vào ví</DialogDescription>
        </DialogHeader>

        {/* STEP 1: Nhập số tiền */}
        {step === 'form' && (
          <div className="space-y-4 py-2">
            <div>
              <Label>Số tiền (VNĐ)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={10_000}
                step={10_000}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Tối thiểu 10,000đ</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preset)}
                  className={amount === preset ? 'border-primary text-primary' : ''}
                >
                  {preset.toLocaleString('vi-VN')}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={depositMutation.isPending || amount < 10_000}
              className="w-full"
            >
              {depositMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Tạo QR thanh toán'
              )}
            </Button>
          </div>
        )}

        {/* STEP 2: Hiển thị QR */}
        {step === 'qr' && orderCode && (
          <div className="space-y-4 py-2 text-center">
            <div className="flex justify-center bg-white p-3 rounded-lg border">
              <QRCodeSVG value={qrContent} size={200} />
            </div>

            <p className="text-sm font-medium">Số tiền: {formatVND(amount)}</p>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                Nội dung CK:{' '}
                <span className="font-mono font-medium text-foreground">{orderCode}</span>
              </p>
              <p>Hết hạn: {expiredAt ? new Date(expiredAt).toLocaleString('vi-VN') : '15 phút'}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-xs text-yellow-800 text-left">
              <AlertCircle className="inline h-4 w-4 mr-1 shrink-0" />
              Nhập <strong>đúng nội dung</strong> chuyển khoản để hệ thống tự động xác nhận.
            </div>

            {import.meta.env.DEV && (
              <Button variant="outline" size="sm" className="w-full" onClick={handleMockSuccess}>
                [Dev] Giả lập thanh toán thành công
              </Button>
            )}
          </div>
        )}

        {/* STEP 3: Đang xác nhận */}
        {step === 'processing' && (
          <div className="text-center py-8">
            <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
            <p className="mt-2 text-sm">Đang xác nhận thanh toán...</p>
          </div>
        )}

        {/* STEP 4: Thành công */}
        {step === 'success' && (
          <div className="text-center py-8 space-y-2">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <p className="font-medium text-lg">Nạp tiền thành công!</p>
            <p className="text-sm text-muted-foreground">{formatVND(amount)} đã vào ví</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
