import { Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '../contexts/ThemeContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '../components/ui/tooltip';
import { Toaster } from '../components/ui/toaster';
import { Toaster as Sonner } from '../components/ui/sonner';
import i18n from '../i18n';
import Dashboard from './pages/user/Dashboard';
import Practice from './pages/user/Practice';
import Home from './pages/user/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import QuestionBank from './pages/user/QuestionBank';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import Profile from './pages/user/Profile';
import SelectTargetRole from './pages/user/SelectTargetRole';
import AdminDashboard from './pages/admin/AdminDashboard';
import InterviewRoom from './pages/InterviewRoom';
import CodeEditor from './pages/user/CodeEditor';

interface ProtectedRouteProps {
  element: React.ReactNode;
  roles?: string[]; // optional, chỉ định role được phép
}

const ProtectedRoute = ({ element, roles }: ProtectedRouteProps) => {
  const userStore = localStorage.getItem('user');
  if (!userStore) return <Navigate to="/login" replace />;

  const user = JSON.parse(userStore);

  // role check
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return element;
};

interface AppProps {
  queryClient: any;
}

export function App({ queryClient }: AppProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-right" duration={3000} richColors closeButton />
            <Routes>
              <Route path="*" element={<NotFound />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/select-target-role" element={<SelectRoleGuard />} />
              <Route
                path="/interview/:roomId"
                element={<ProtectedRoute element={<InterviewRoom />} />}
              />
              <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
              <Route path="/" element={<ProtectedRoute element={<Home />} />} />
              <Route
                path="/practice"
                element={<ProtectedRoute element={<Practice />} roles={['CANDIDATE']} />}
              />
              <Route
                path="/question-bank"
                element={<ProtectedRoute element={<QuestionBank />} />}
              />
              <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
              <Route
                path="/admin/dashboard"
                element={<AdminDashboard />}
              />
                <Route path="/pracite/code-editer" element={<ProtectedRoute element={<CodeEditor />} />} />
            </Routes>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

// Tách logic SelectRole ra để dễ quản lý
const SelectRoleGuard = () => {
  const userStore = localStorage.getItem('user');
  if (!userStore) return <Navigate to="/login" replace />;

  const user = JSON.parse(userStore);

  // Nếu chưa có targetRole thì mới cho ở lại trang chọn role
  if (!user.targetRole) {
    return <SelectTargetRole />;
  }

  // Nếu đã có rồi thì về Home luôn
  return <Navigate to="/" replace />;
};

export default App;
