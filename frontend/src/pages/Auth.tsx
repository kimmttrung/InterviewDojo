import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Github } from 'lucide-react';

export default function Auth() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleGoogleLogin = () => {
        // Simulate login and redirect to role selection
        localStorage.setItem('user', JSON.stringify({ name: 'John Doe', email: 'john@example.com' }));
        navigate('/login');
    };

    const handleGithubLogin = () => {
        // Simulate login and redirect to role selection
        localStorage.setItem('user', JSON.stringify({ name: 'Jane Doe', email: 'jane@example.com' }));
        navigate('/login');
    };

    return (
        <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
            <Card className="w-full max-w-md p-6 bg-background/95 backdrop-blur shadow-2xl border-none">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground font-bold mx-auto mb-4">
                        ID
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        {t('navbar.logo')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('auth.welcome')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        {t('auth.description')}
                    </p>
                </div>
                <div className="space-y-4">
                    <Button
                        onClick={handleGoogleLogin}
                        /* Thêm flex items-center justify-center để icon và chữ thẳng hàng */
                        className="w-full h-11 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>{t('auth.googleSignIn')}</span>
                    </Button>

                    <Button
                        onClick={handleGithubLogin}
                        /* Sử dụng gap-2 để tạo khoảng cách đều giữa icon và chữ */
                        className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-2"
                    >
                        <Github className="w-5 h-5" />
                        <span>{t('auth.githubSignIn')}</span>
                    </Button>
                </div>

                <div className="relative mt-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-muted"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-background text-muted-foreground">
                            {t('auth.or')}
                        </span>
                    </div>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    {t('auth.noAccount')}{' '}
                    <button className="text-primary hover:underline font-medium">
                        {t('auth.createAccount')}
                    </button>
                </p>
            </Card>
        </div>
    );
}
