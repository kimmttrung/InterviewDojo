import { Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '../contexts/ThemeContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster as Sonner } from '../shared/components/ui/sonner';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Toaster } from '../shared/components/ui/toaster';
import i18n from '../shared/i18n';
import NotFound from '../shared/components/layout/NotFound';
import Unauthorized from '../shared/components/layout/Unauthorized';
import MentorSetup from '../features/mentor/dashboard/components/MentorSetup';
import Dashboard from '../features/candidate/dashboard/pages/Dashboard';
import Home from '../features/candidate/home/pages/HomePage';
import Practice from '../features/candidate/practice/PracticePage';
import Profile from '../features/candidate/profile/pages/Profile';
import MentorDashboard from '../features/mentor/dashboard/pages/MentorDashboard';
import MentorBookings from '../features/mentor/booking-management/pages/MentorBookings';
import MentorSchedule from '../features/mentor/schedule-management/pages/MentorSchedule';
import MentorProfile from '../features/mentor/profile-management/pages/MentorProfile';
import AdminDashboard from '../features/admin/dashboard/pages/AdminDashboard';
import CategoriesPage from '../features/admin/category-management/pages/CategoriesPage';
import CompaniesPage from '../features/admin/company-management/pages/CompaniesPage';
import SelectTargetRole from '../features/candidate/target-role/pages/SelectTargetRole';
import Login from '../features/shared-domain/auth/pages/Login';
import Register from '../features/shared-domain/auth/pages/Register';
import InterviewRoom from '../features/candidate/practice/interviews/peer-interview/pages/InterviewRoom';
import SoloRecording from '../features/candidate/practice/interviews/solo-ai/pages/SoloRecording';
import PeerMatchingPage from '../features/candidate/practice/interviews/peer-interview/pages/PeerMatchingPage';
import QuestionBank from '../features/shared-domain/question-bank/pages/QuestionBank';
import QuestionBankDetail from '../features/shared-domain/question-bank/pages/QuestionBankDetail';
import QuestionsPage from '../features/admin/question-management/pages/QuestionsPage';
import AIAnalysisResult from '../features/candidate/practice/interviews/solo-ai/pages/AIAnalysisResult';

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
              <Route path="/candidate/setup" element={<SelectRoleGuard />} />
              <Route
                path="/mentor/setup"
                element={<ProtectedRoute element={<MentorSetup />} roles={['MENTOR']} />}
              />
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
                path="/practice/solo-recording"
                element={<ProtectedRoute element={<SoloRecording />} roles={['CANDIDATE']} />}
              />
              <Route
                path="/practice/matching"
                element={<ProtectedRoute element={<PeerMatchingPage />} roles={['CANDIDATE']} />}
              />
              <Route
                path="/question-bank"
                element={<ProtectedRoute element={<QuestionBank />} />}
              />
              <Route
                path="/questions/:id/:slug"
                element={<ProtectedRoute element={<QuestionBankDetail />} />}
              />
              <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
              <Route
                path="/mentor/dashboard"
                element={<ProtectedRoute element={<MentorDashboard />} roles={['MENTOR']} />}
              />
              <Route
                path="/mentor/bookings"
                element={<ProtectedRoute element={<MentorBookings />} roles={['MENTOR']} />}
              />
              <Route
                path="/mentor/schedule"
                element={<ProtectedRoute element={<MentorSchedule />} roles={['MENTOR']} />}
              />
              <Route
                path="/mentor/profile"
                element={<ProtectedRoute element={<MentorProfile />} roles={['MENTOR']} />}
              />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/questions" element={<QuestionsPage />} />
              <Route path="/admin/categories" element={<CategoriesPage />} />
              <Route path="/admin/companies" element={<CompaniesPage />} />
              <Route
                path="/ai-analysis/:recordingId"
                element={<ProtectedRoute element={<AIAnalysisResult />} roles={['CANDIDATE']} />}
              />
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
