import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { showToast } from '../../lib/toast';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      console.log('check res', res);
      const response = res.data.data;
      const redirect = response.redirect;

      // lưu token
      localStorage.setItem('access_token', response.data.accessToken);
      localStorage.setItem('refresh_token', response.data.refreshToken);

      // lưu user
      localStorage.setItem('user', JSON.stringify(response.data.user));
      showToast.success(t('Login successful'));

      const userRole = response.data.user;

      // 🎯 redirect theo role
      if (redirect) {
        navigate(redirect);
      } else if (userRole.role === 'ADMIN' || userRole.role === 'STAFF') {
        navigate('/admin');
      } else if (userRole.role === 'MENTOR' && redirect === null) {
        navigate('/mentor/dashboard');
      } else if (userRole.role === 'CANIDATE' && redirect === null) {
        navigate('/');
      }
    } catch (error) {
      showToast.error('Something went wrong');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-8 left-8 text-white/70 hover:text-white flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{t('common.back')}</span>
      </button>

      <Card className="w-full max-w-md p-8 bg-background/95 backdrop-blur-xl shadow-2xl border-none ring-1 ring-white/10">
        <div className="text-center mb-8">
          {/* Logo dự án */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground font-bold mx-auto mb-4 shadow-lg shadow-primary/20 transform rotate-12">
            <span className="text-2xl -rotate-12">ID</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('navbar.logo')}</h1>
          <p className="text-muted-foreground mt-2">{t('navbar.welcomeBack')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
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

          {/* Password Field */}
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
            <div className="w-full border-t border-muted"></div>
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
    </div>
  );
}
