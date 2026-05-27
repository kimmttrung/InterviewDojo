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
import { AlertCircle, CheckCircle, Loader2, Copy, Banknote } from 'lucide-react';
import { showToast } from '@/shared/lib/toast';

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [10_000, 50_000, 100_000, 200_000, 500_000];

export const DepositModal = ({ open, onClose, onSuccess }: DepositModalProps) => {
  const [amount, setAmount] = useState(100_000);
  const [step, setStep] = useState<'form' | 'qr' | 'processing' | 'success'>('form');
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [expiredAt, setExpiredAt] = useState<string | null>(null);
  const depositMutation = useDeposit();

  // Lấy thông tin ngân hàng từ env
  const bankAccountNumber = import.meta.env.VITE_BANK_ACCOUNT_NUMBER;
  const bankAccountName = import.meta.env.VITE_BANK_ACCOUNT_NAME || '';
  const bankCode = import.meta.env.VITE_BANK_CODE || 'MB';

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
      const data = await depositMutation.mutateAsync(amount);
      setPaymentId(data.paymentId);
      setOrderCode(data.orderCode);
      setExpiredAt(data.expiredAt);
      setStep('qr');
    } catch {
      // lỗi đã toast
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast.success('Đã sao chép');
  };

  const formatVND = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  // Tạo URL ảnh VietQR chuẩn (scan được bằng app ngân hàng)
  const generateVietQRUrl = () => {
    if (!orderCode || !bankAccountNumber) return '';
    return `https://img.vietqr.io/image/${bankCode}-${bankAccountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(bankAccountName)}`;
  };

  const qrImageUrl = generateVietQRUrl();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nạp tiền vào ví</DialogTitle>
          <DialogDescription>Chuyển khoản theo hướng dẫn để nạp credits vào ví</DialogDescription>
        </DialogHeader>

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

        {step === 'qr' && orderCode && (
          <div className="space-y-4 py-2 text-center">
            {/* QR Code – ảnh VietQR chuẩn */}
            <div className="flex justify-center bg-white p-3 rounded-lg border">
              {qrImageUrl ? (
                <img src={qrImageUrl} alt="VietQR" className="w-52 h-52 object-contain" />
              ) : (
                <div className="w-52 h-52 bg-gray-100 flex items-center justify-center text-muted-foreground">
                  <Banknote className="h-8 w-8" />
                </div>
              )}
            </div>

            {/* Thông tin chuyển khoản thủ công (fallback) */}
            <div className="text-left space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Ngân hàng:</span>
                <span>MB Bank (TMCP Quân Đội)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Số tài khoản:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono">{bankAccountNumber}</span>
                  <button
                    onClick={() => copyToClipboard(bankAccountNumber)}
                    className="text-primary"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Chủ tài khoản:</span>
                <span>{bankAccountName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Số tiền:</span>
                <span className="font-bold">{formatVND(amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Nội dung CK:</span>
                <div className="flex items-center gap-1">
                  <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">
                    {orderCode}
                  </code>
                  <button onClick={() => copyToClipboard(orderCode)} className="text-primary">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-xs text-yellow-800 text-left">
              <AlertCircle className="inline h-4 w-4 mr-1 shrink-0" />
              <strong>Quan trọng:</strong> Nhập <strong>chính xác</strong> nội dung chuyển khoản để
              hệ thống tự động cập nhật.
            </div>

            {import.meta.env.DEV && (
              <Button variant="outline" size="sm" className="w-full" onClick={handleMockSuccess}>
                [Dev] Giả lập thanh toán thành công
              </Button>
            )}
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
            <p className="mt-2 text-sm">Đang xác nhận thanh toán...</p>
          </div>
        )}

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
