// src/features/auth/pages/Login.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertTriangle, Clock, ShieldOff } from 'lucide-react';
import { authService } from '../services/auth.service';
import { showToast } from '../../../shared/lib/toast';
import { Card } from '../../../shared/components/ui/card';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Button } from '../../../shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../shared/components/ui/dialog';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BanModalState {
  open: boolean;
  isPermanent: boolean;
  message: string;
  banReason: string | null;
  remainingDays: number | null;
  remainingHours: number | null;
  bannedUntilLocal: string | null;
}

const INITIAL_BAN_MODAL: BanModalState = {
  open: false,
  isPermanent: false,
  message: '',
  banReason: null,
  remainingDays: null,
  remainingHours: null,
  bannedUntilLocal: null,
};

// ─── Parse ban error từ bất kỳ response shape nào ────────────────────────────
function parseBanError(responseData: unknown): {
  isBan: boolean;
  message: string;
  code: string;
  banReason: string | null;
  remainingDays: number | null;
  remainingHours: number | null;
  bannedUntilLocal: string | null;
} {
  const FALLBACK = {
    isBan: false,
    message: '',
    code: '',
    banReason: null,
    remainingDays: null,
    remainingHours: null,
    bannedUntilLocal: null,
  };

  if (!responseData || typeof responseData !== 'object') return FALLBACK;
  const rd = responseData as Record<string, unknown>;

  // Shape 1: AllExceptionsFilter → { message: string, data: { error, code, ... } }
  if (rd['data'] && typeof rd['data'] === 'object') {
    const d = rd['data'] as Record<string, unknown>;
    if (d['error'] === 'ACCOUNT_BANNED') {
      return {
        isBan: true,
        message: typeof rd['message'] === 'string' ? rd['message'] : '',
        code: typeof d['code'] === 'string' ? d['code'] : '',
        banReason: typeof d['banReason'] === 'string' ? d['banReason'] : null,
        remainingDays: typeof d['remainingDays'] === 'number' ? d['remainingDays'] : null,
        remainingHours: typeof d['remainingHours'] === 'number' ? d['remainingHours'] : null,
        bannedUntilLocal: typeof d['bannedUntilLocal'] === 'string' ? d['bannedUntilLocal'] : null,
      };
    }
  }

  // Shape 2: NestJS default → { message: { error, code, message, banReason, ... } }
  if (rd['message'] && typeof rd['message'] === 'object') {
    const m = rd['message'] as Record<string, unknown>;
    if (m['error'] === 'ACCOUNT_BANNED') {
      return {
        isBan: true,
        message: typeof m['message'] === 'string' ? m['message'] : '',
        code: typeof m['code'] === 'string' ? m['code'] : '',
        banReason: typeof m['banReason'] === 'string' ? m['banReason'] : null,
        remainingDays: typeof m['remainingDays'] === 'number' ? m['remainingDays'] : null,
        remainingHours: typeof m['remainingHours'] === 'number' ? m['remainingHours'] : null,
        bannedUntilLocal: typeof m['bannedUntilLocal'] === 'string' ? m['bannedUntilLocal'] : null,
      };
    }
  }

  // Shape 3: flat → { error: 'ACCOUNT_BANNED', code, message, banReason, ... }
  if (rd['error'] === 'ACCOUNT_BANNED') {
    return {
      isBan: true,
      message: typeof rd['message'] === 'string' ? rd['message'] : '',
      code: typeof rd['code'] === 'string' ? rd['code'] : '',
      banReason: typeof rd['banReason'] === 'string' ? rd['banReason'] : null,
      remainingDays: typeof rd['remainingDays'] === 'number' ? rd['remainingDays'] : null,
      remainingHours: typeof rd['remainingHours'] === 'number' ? rd['remainingHours'] : null,
      bannedUntilLocal: typeof rd['bannedUntilLocal'] === 'string' ? rd['bannedUntilLocal'] : null,
    };
  }

  return FALLBACK;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [banModal, setBanModal] = useState<BanModalState>(INITIAL_BAN_MODAL);
  const setAuth = useAuthStore((state) => state.setAuth);

  /**
   * Nhận navigate state từ GlobalAuthListener trong App.tsx.
   * Khi refresh token bị 403 (banned), App.tsx navigate tới /login
   * với state { banReason: 'session_expired_banned' }.
   * Login.tsx bắt state này và mở modal generic.
   *
   * Dùng location.state thay vì useSearchParams để tránh URL xấu
   * và tránh useEffect chạy lại khi params thay đổi.
   */
  useEffect(() => {
    const state = location.state as { banReason?: string } | null;
    if (state?.banReason === 'session_expired_banned') {
      setBanModal({
        open: true,
        isPermanent: false,
        message:
          'Phiên đăng nhập của bạn đã bị chấm dứt vì tài khoản bị khóa. Vui lòng đăng nhập lại để xem chi tiết.',
        banReason: null,
        remainingDays: null,
        remainingHours: null,
        bannedUntilLocal: null,
      });
      // Xóa state khỏi history để F5 không trigger lại modal
      navigate('/login', { replace: true, state: null });
    }
  }, [location.state, navigate]);

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      const { accessToken, refreshToken, user, redirect } = res.data.data;
      setAuth({ accessToken, refreshToken });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      showToast.success(t('Login successful'));

      if (redirect) navigate(redirect);
      else if (user.role === 'ADMIN' || user.role === 'STAFF') navigate('/admin/dashboard');
      else if (user.role === 'MENTOR') navigate('/mentor/dashboard');
      else navigate('/home');
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown } };
      const status = err?.response?.status;
      const responseData = err?.response?.data;

      if (status === 403) {
        const ban = parseBanError(responseData);
        if (ban.isBan) {
          setBanModal({
            open: true,
            isPermanent: ban.code === 'PERMANENT_BAN',
            message: ban.message || 'Tài khoản của bạn đã bị khóa.',
            banReason: ban.banReason,
            remainingDays: ban.remainingDays,
            remainingHours: ban.remainingHours,
            bannedUntilLocal: ban.bannedUntilLocal,
          });
          return;
        }
      }

      const rd = responseData as Record<string, unknown> | undefined;
      const message =
        typeof rd?.['message'] === 'string' ? rd['message'] : 'Sai email hoặc mật khẩu';
      showToast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const closeBanModal = () => setBanModal((prev) => ({ ...prev, open: false }));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-8 left-8 text-white/70 hover:text-white flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{t('common.back')}</span>
      </button>

      <Card className="w-full max-w-md p-8 bg-background/95 backdrop-blur-xl shadow-2xl border-none ring-1 ring-white/10">
        <div className="text-center mb-8">
          {/* Đã sửa bg-primary thành dải màu gradient tím và đổi viền bóng shadow */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold mx-auto mb-4 shadow-lg shadow-purple-500/30 transform rotate-12">
            <span className="text-2xl -rotate-12">ID</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('navbar.logo')}</h1>
          <p className="text-muted-foreground mt-2">{t('navbar.welcomeBack')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10 h-11 bg-muted/50 focus:bg-background transition-all"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <button type="button" className="text-xs text-primary hover:underline">
                {t('auth.forgotPassword')}
              </button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 h-11 bg-muted/50 focus:bg-background transition-all"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-primary hover:opacity-90 shadow-lg shadow-primary/25 transition-all font-semibold"
          >
            {isLoading ? t('auth.processing') : t('auth.loginNow')}
          </Button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 bg-background text-muted-foreground tracking-widest">
              {t('auth.continueWith')}
            </span>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-primary hover:underline font-medium"
          >
            {t('auth.createAccount')}
          </button>
        </p>
      </Card>

      {/* ── Ban Modal ──────────────────────────────────────────────────────────── */}
      <Dialog open={banModal.open} onOpenChange={(open) => !open && closeBanModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle
              className={`flex items-center gap-2 ${banModal.isPermanent ? 'text-red-500' : 'text-yellow-500'}`}
            >
              {banModal.isPermanent ? (
                <ShieldOff className="w-5 h-5 shrink-0" />
              ) : (
                <Clock className="w-5 h-5 shrink-0" />
              )}
              {banModal.isPermanent ? 'Tài khoản bị khóa vĩnh viễn' : 'Tài khoản bị khóa tạm thời'}
            </DialogTitle>
            <DialogDescription>
              {banModal.isPermanent
                ? 'Tài khoản của bạn đã bị quản trị viên khóa vĩnh viễn.'
                : 'Tài khoản của bạn đang bị khóa tạm thời.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-5 h-5 shrink-0 mt-0.5 ${banModal.isPermanent ? 'text-red-500' : 'text-yellow-500'}`}
              />
              <p className="text-sm leading-relaxed">{banModal.message}</p>
            </div>

            {banModal.banReason && (
              <div className="rounded-lg bg-muted/60 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Lý do
                </p>
                <p className="text-sm">{banModal.banReason}</p>
              </div>
            )}

            {!banModal.isPermanent &&
              banModal.remainingDays !== null &&
              banModal.remainingHours !== null && (
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">
                    Thời gian còn lại
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-500">{banModal.remainingDays}</p>
                      <p className="text-xs text-muted-foreground">ngày</p>
                    </div>
                    <div className="text-yellow-500 font-bold text-xl">:</div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-500">
                        {banModal.remainingHours}
                      </p>
                      <p className="text-xs text-muted-foreground">giờ</p>
                    </div>
                  </div>
                  {banModal.bannedUntilLocal && (
                    <p className="text-xs text-muted-foreground">
                      Hết hạn lúc:{' '}
                      <span className="font-medium text-foreground">
                        {banModal.bannedUntilLocal}
                      </span>
                    </p>
                  )}
                </div>
              )}

            <p className="text-xs text-muted-foreground text-center">
              {banModal.isPermanent
                ? 'Vui lòng liên hệ bộ phận hỗ trợ để được giải quyết.'
                : banModal.remainingDays === null
                  ? 'Vui lòng đăng nhập lại để xem thời gian khóa chi tiết.'
                  : 'Vui lòng quay lại sau khi hết thời gian khóa.'}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant={banModal.isPermanent ? 'destructive' : 'default'}
              onClick={closeBanModal}
              className="w-full"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
