import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Eye, EyeOff, Lock, Mail, User, ArrowLeft, ShieldCheck } from 'lucide-react';
import { showToast } from '../../../shared/lib/toast';
import { authService } from '../services/auth.service';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CANDIDATE',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showToast.error(t('register.passwordMismatch'));
      return;
    }
    try {
      setIsLoading(true);

      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      showToast.success(t('register.registerSuccess'));
      navigate('/login');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Something went wrong';

      showToast.error(message);
      console.error('Register error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-8 left-8 text-white/70 hover:text-white flex items-center gap-2 transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{t('common.back')}</span>
      </button>

      <Card className="w-full max-w-md p-8 bg-background/95 backdrop-blur-xl shadow-2xl border-none ring-1 ring-white/10 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold mx-auto mb-4 shadow-lg shadow-primary/20 transform rotate-12">
            <span className="text-xl -rotate-12">ID</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t('register.title')}
          </h1>

          <p className="text-sm text-muted-foreground mt-2">{t('register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>

            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />

              <Input
                id="name"
                type="text"
                placeholder="Your name"
                className="pl-10 bg-muted/50 focus:bg-background transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('register.email')}</Label>

            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />

              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10 bg-muted/50 focus:bg-background transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">{t('register.password')}</Label>

            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />

              <Input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 bg-muted/50 focus:bg-background transition-all"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />

              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">{t('register.confirmPassword')}</Label>

            <div className="relative group">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />

              <Input
                id="confirmPassword"
                type={showConfirmPass ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 bg-muted/50 focus:bg-background transition-all"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />

              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'CANDIDATE' })}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition
                                    ${
                                      formData.role === 'CANDIDATE'
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-muted border-muted-foreground/20'
                                    }`}
              >
                CANDIDATE
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'MENTOR' })}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition
                                    ${
                                      formData.role === 'MENTOR'
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-muted border-muted-foreground/20'
                                    }`}
              >
                MENTOR
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-primary hover:opacity-90 shadow-lg shadow-primary/25 transition-all font-semibold mt-2"
          >
            {isLoading ? t('register.creatingAccount') : t('register.registerNow')}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('register.haveAccount')}{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-primary hover:underline font-medium"
          >
            {t('register.loginHere')}
          </button>
        </p>
      </Card>
    </div>
  );
}
