import { Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '../contexts/ThemeContext';
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
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import InterviewRoom from '../features/candidate/practice/interviews/peer-interview/pages/InterviewRoom';
import SoloRecording from '../features/candidate/practice/interviews/solo-ai/pages/SoloRecording';
import PeerMatchingPage from '../features/candidate/practice/interviews/peer-interview/pages/PeerMatchingPage';
import QuestionBank from '../features/shared-domain/question-bank/pages/QuestionBank';
import QuestionBankDetail from '../features/shared-domain/question-bank/pages/QuestionBankDetail';
import QuestionsPage from '../features/admin/question-management/pages/QuestionsPage';
import AIAnalysisResult from '../features/candidate/practice/interviews/solo-ai/pages/AIAnalysisResult';
import { useAuthStore } from '@/stores/useAuthStore';
import { ProtectedRoute, useCurrentUser } from '@/features/auth';
import MentorDetailPage from '../features/candidate/book-mentor/pages/MentorDetailPage';

// ──────────────────────────────────────────
// Guard cho trang chọn target role
// ──────────────────────────────────────────
const SelectRoleGuard = () => {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.targetRole) {
    return <SelectTargetRole />;
  }

  return <Navigate to="/" replace />;
};

// ──────────────────────────────────────────
// App component chính
// ──────────────────────────────────────────
export function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" duration={3000} richColors closeButton />
          <Routes>
            <Route path="*" element={<NotFound />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Target Role Setup */}
            <Route path="/candidate/setup" element={<SelectRoleGuard />} />
            <Route
              path="/mentor/setup"
              element={
                <ProtectedRoute roles={['MENTOR']}>
                  <MentorSetup />
                </ProtectedRoute>
              }
            />

            {/* Interview Room */}
            <Route
              path="/interview/:roomId"
              element={
                <ProtectedRoute>
                  <InterviewRoom />
                </ProtectedRoute>
              }
            />

            {/* Dashboard & Home */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            {/* Practice – chỉ candidate */}
            <Route
              path="/practice"
              element={
                <ProtectedRoute roles={['CANDIDATE']}>
                  <Practice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/practice/solo-recording"
              element={
                <ProtectedRoute roles={['CANDIDATE']}>
                  <SoloRecording />
                </ProtectedRoute>
              }
            />
            <Route
              path="/practice/matching"
              element={
                <ProtectedRoute roles={['CANDIDATE']}>
                  <PeerMatchingPage />
                </ProtectedRoute>
              }
            />

            {/* Question Bank (ai cũng xem được nếu đã login) */}
            <Route
              path="/question-bank"
              element={
                <ProtectedRoute>
                  <QuestionBank />
                </ProtectedRoute>
              }
            />
            <Route
              path="/questions/:id/:slug"
              element={
                <ProtectedRoute>
                  <QuestionBankDetail />
                </ProtectedRoute>
              }
            />

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/mentors/:mentorId"
              element={
                <ProtectedRoute roles={['CANDIDATE']}>
                  <MentorDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Mentor routes */}
            <Route
              path="/mentor/dashboard"
              element={
                <ProtectedRoute roles={['MENTOR']}>
                  <MentorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor/bookings"
              element={
                <ProtectedRoute roles={['MENTOR']}>
                  <MentorBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor/schedule"
              element={
                <ProtectedRoute roles={['MENTOR']}>
                  <MentorSchedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor/profile"
              element={
                <ProtectedRoute roles={['MENTOR']}>
                  <MentorProfile />
                </ProtectedRoute>
              }
            />

            {/* Admin routes – bắt buộc role ADMIN */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/questions"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <QuestionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/companies"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <CompaniesPage />
                </ProtectedRoute>
              }
            />

            {/* AI Analysis */}
            <Route
              path="/ai-analysis/:recordingId"
              element={
                <ProtectedRoute roles={['CANDIDATE']}>
                  <AIAnalysisResult />
                </ProtectedRoute>
              }
            />
          </Routes>
        </TooltipProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
