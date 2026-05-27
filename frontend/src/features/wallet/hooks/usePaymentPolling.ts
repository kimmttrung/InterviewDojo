// src/features/wallet/hooks/usePaymentPolling.ts
import { useEffect, useRef, useCallback } from 'react';
import { paymentApi } from '../api/paymentApi';

export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';

interface UsePaymentPollingOptions {
  paymentId: number | null;
  enabled: boolean;
  intervalMs?: number;
  onPaid: () => void;
  onExpired?: () => void;
}

export function usePaymentPolling({
  paymentId,
  enabled,
  intervalMs = 3000,
  onPaid,
  onExpired,
}: UsePaymentPollingOptions) {
  const onPaidRef = useRef(onPaid);
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);
  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  const stopRef = useRef(false);

  const poll = useCallback(async () => {
    if (!paymentId) return;
    try {
      const res = await paymentApi.getStatus(paymentId);
      const status: PaymentStatus = res.data.data.status;

      if (status === 'PAID') {
        stopRef.current = true;
        onPaidRef.current();
        return;
      }
      if (status === 'EXPIRED' || status === 'FAILED') {
        stopRef.current = true;
        onExpiredRef.current?.();
        return;
      }
    } catch {
      // mạng lỗi tạm thời → bỏ qua, tiếp tục poll
    }
  }, [paymentId]);

  useEffect(() => {
    if (!enabled || !paymentId) return;

    stopRef.current = false;
    poll();

    const id = setInterval(() => {
      if (stopRef.current) {
        clearInterval(id);
        return;
      }
      poll();
    }, intervalMs);

    return () => {
      clearInterval(id);
      stopRef.current = true;
    };
  }, [enabled, paymentId, intervalMs, poll]);
}
