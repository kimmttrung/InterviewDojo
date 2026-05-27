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
import { usePaymentPolling } from '../hooks/usePaymentPolling';
import { AlertCircle, CheckCircle, Loader2, Copy, Banknote, Clock } from 'lucide-react';
import { showToast } from '@/shared/lib/toast';

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [10_000, 50_000, 100_000, 200_000, 500_000];

type Step = 'form' | 'qr' | 'success' | 'expired';

export const DepositModal = ({ open, onClose, onSuccess }: DepositModalProps) => {
  const [amount, setAmount] = useState(100_000);
  const [step, setStep] = useState<Step>('form');
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [expiredAt, setExpiredAt] = useState<string | null>(null);

  const depositMutation = useDeposit();

  const bankAccountNumber = import.meta.env.VITE_BANK_ACCOUNT_NUMBER as string;
  const bankAccountName = (import.meta.env.VITE_BANK_ACCOUNT_NAME as string) || '';
  const bankCode = (import.meta.env.VITE_BANK_CODE as string) || 'MB';

  // ── Polling: chỉ chạy khi đang ở bước QR ──────────────────────────────────
  usePaymentPolling({
    paymentId,
    enabled: step === 'qr',
    intervalMs: 3000,
    onPaid: () => {
      // Webhook đã xác nhận PAID → chuyển sang success, refetch ví
      setStep('success');
      onSuccess?.();
      setTimeout(onClose, 2500);
    },
    onExpired: () => {
      setStep('expired');
    },
  });

  // Reset khi modal đóng
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
      // lỗi đã toast trong useDeposit.onError
    }
  };

  // Dev only — gọi mock rồi để polling tự phát hiện PAID
  // const handleMockSuccess = async () => {
  //   if (!paymentId) return;
  //   try {
  //     await paymentApi.mockSuccess(paymentId);
  //     // Không cần setStep ở đây — polling sẽ phát hiện status PAID trong ≤3s
  //   } catch (err) {
  //     console.error(err);
  //     showToast.error('Mock thất bại');
  //   }
  // };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast.success('Đã sao chép');
  };

  const formatVND = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  const qrImageUrl =
    orderCode && bankAccountNumber
      ? `https://img.vietqr.io/image/${bankCode}-${bankAccountNumber}-compact2.png` +
        `?amount=${amount}` +
        `&addInfo=${encodeURIComponent(orderCode)}` +
        `&accountName=${encodeURIComponent(bankAccountName)}`
      : '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nạp tiền vào ví</DialogTitle>
          <DialogDescription>Chuyển khoản theo hướng dẫn để nạp credits vào ví</DialogDescription>
        </DialogHeader>

        {/* ── STEP 1: Nhập số tiền ── */}
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

        {/* ── STEP 2: Hiển thị QR + polling chạy ngầm ── */}
        {step === 'qr' && orderCode && (
          <div className="space-y-4 py-2 text-center">
            {/* Indicator polling đang chạy */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Đang chờ xác nhận thanh toán...
            </div>

            {/* QR Image từ VietQR */}
            <div className="flex justify-center bg-white p-3 rounded-lg border">
              {qrImageUrl ? (
                <img src={qrImageUrl} alt="VietQR" className="w-52 h-52 object-contain" />
              ) : (
                <div className="w-52 h-52 bg-gray-100 flex items-center justify-center text-muted-foreground">
                  <Banknote className="h-8 w-8" />
                </div>
              )}
            </div>

            {/* Thông tin chuyển khoản thủ công */}
            <div className="text-left space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ngân hàng</span>
                <span className="font-medium">MB Bank</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Số tài khoản</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-medium">{bankAccountNumber}</span>
                  <button
                    onClick={() => copyToClipboard(bankAccountNumber)}
                    className="text-primary hover:opacity-70"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {bankAccountName && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Chủ tài khoản</span>
                  <span className="font-medium">{bankAccountName}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Số tiền</span>
                <span className="font-bold text-primary">{formatVND(amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nội dung CK</span>
                <div className="flex items-center gap-1.5">
                  <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono font-semibold">
                    {orderCode}
                  </code>
                  <button
                    onClick={() => copyToClipboard(orderCode)}
                    className="text-primary hover:opacity-70"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {expiredAt && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Hết hạn</span>
                  <div className="flex items-center gap-1 text-yellow-600 text-xs">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(expiredAt).toLocaleTimeString('vi-VN')}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-xs text-yellow-800 text-left">
              <AlertCircle className="inline h-4 w-4 mr-1 shrink-0" />
              <strong>Quan trọng:</strong> Nhập <strong>chính xác</strong> nội dung chuyển khoản để
              hệ thống tự động cập nhật số dư.
            </div>

            {/* Chỉ hiện trong môi trường dev */}
            {/* {import.meta.env.DEV && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={handleMockSuccess}
              >
                [Dev] Giả lập thanh toán thành công
              </Button>
            )} */}
          </div>
        )}

        {/* ── STEP 3: Thành công (polling phát hiện PAID) ── */}
        {step === 'success' && (
          <div className="text-center py-10 space-y-3">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <p className="font-semibold text-xl">Nạp tiền thành công!</p>
            <p className="text-muted-foreground text-sm">
              <span className="font-medium text-foreground">{formatVND(amount)}</span> đã được cộng
              vào ví của bạn.
            </p>
            <p className="text-xs text-muted-foreground">Tự động đóng sau 2 giây...</p>
          </div>
        )}

        {/* ── STEP 4: Hết hạn ── */}
        {step === 'expired' && (
          <div className="text-center py-10 space-y-3">
            <div className="flex justify-center">
              <div className="rounded-full bg-gray-100 p-4">
                <Clock className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <p className="font-semibold text-xl">QR đã hết hạn</p>
            <p className="text-muted-foreground text-sm">
              Đơn nạp tiền đã hết thời gian 15 phút. Vui lòng tạo đơn mới.
            </p>
            <Button className="w-full" onClick={() => setStep('form')}>
              Tạo lại
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
