import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '../contexts/ThemeContext';
import { Toaster as Sonner } from '../shared/components/ui/sonner';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Toaster } from '../shared/components/ui/toaster';
import i18n from '../shared/i18n';
import NotFound from '../shared/components/layout/NotFound';
import Unauthorized from '../shared/components/layout/Unauthorized';

import CandidateDashboardPage from '../features/candidate/dashboard/pages/CandidateDashboardPage';
import Home from '../features/candidate/home/pages/HomePage';
import Practice from '../features/candidate/practice/PracticePage';
import Profile from '../features/candidate/profile/pages/Profile';

import MentorSetup from '../features/mentor/dashboard/components/MentorSetup';
import MentorDashboard from '../features/mentor/dashboard/pages/MentorDashboard';
import MentorBookings from '../features/mentor/booking-management/pages/MentorBookings';
import MentorSchedule from '../features/mentor/schedule-management/pages/MentorSchedulePage';
import MentorDetailPage from '../features/candidate/mentor-booking/pages/MentorDetailPage';
import MentorProfile from '../features/mentor/profile-management/pages/MentorProfileManagement';

import { AdminDashboard } from '@/features/admin/dashboard/pages/AdminDashboard';
import CategoriesPage from '../features/admin/category-management/pages/CategoriesPage';
import CompaniesPage from '../features/admin/company-management/pages/CompaniesPage';
import SelectTargetRole from '../features/candidate/target-role/pages/SelectTargetRole';
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import InterviewRoom from '../features/candidate/practice/interviews/peer-interview/pages/InterviewRoom';
import SoloRecording from '../features/candidate/practice/interviews/solo-ai/pages/SoloRecording';
import PeerMatchingPage from '../features/candidate/practice/interviews/peer-interview/pages/PeerMatchingPage';
import QuestionBank from '../features/shared-domain/question-bank/pages/QuestionBank';
// import QuestionsPage from '../features/admin/question-management/pages/QuestionsPage';
import { BookmarkedQuestionsPage } from '../features/bookmark/components/BookmarkedQuestionsPage';
import AIAnalysisResult from '../features/candidate/practice/interviews/solo-ai/pages/AIAnalysisResult';
import { ProtectedRoute, useCurrentUser } from '@/features/auth';
import QuestionDetailContainer from '../features/shared-domain/question-bank/pages/QuestionDetailContainer';
import MentorListPage from '@/features/candidate/list-mentor/pages/MentorListPage';
import RootRedirect from '@/shared/components/routing/RootRedirect';
import WalletPage from '@/features/wallet/pages/WalletPage';
import SessionPage from '@/features/session/components/SessionPage';
import { MentorLayout } from '@/features/mentor/dashboard/components/MentorLayout';
import { Navbar } from '@/shared/components/layout/Navbar';
import AdminLayout from '@/features/admin/components/AdminLayout';
import { MentorApprovalList } from '@/features/admin/mentors/pages/MentorApprovalList';
import { MentorDetail } from '@/features/admin/mentors/pages/MentorDetail';
import { UserManagement } from '@/features/admin/users/pages/UserManagement';
import { UserDetail } from '@/features/admin/users/pages/UserDetail';

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

// Layout bọc DUY NHẤT cho Session để thêm Navbar
const SessionLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

// Layout cho Candidate (Không chứa Navbar để các trang Home, Practice tự render layout của nó)
const CandidateLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Outlet />
      </main>
    </div>
  );
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

            {/* ========================================== */}
            {/* NHÓM 1: CÁC TRANG TỰ QUẢN LÝ LAYOUT/NAVBAR */}
            {/* ========================================== */}
            <Route element={<CandidateLayout />}>
              <Route
                path="/home"
                element={
                  <ProtectedRoute roles={['CANDIDATE']}>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wallet"
                element={
                  <ProtectedRoute roles={['CANDIDATE']}>
                    <WalletPage />
                  </ProtectedRoute>
                }
              />

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
                  <ProtectedRoute roles={['CANDIDATE']}>
                    <CandidateDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<RootRedirect />} />

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
            </Route>

            {/* ========================================== */}
            {/* NHÓM 2: CHỈ THÊM NAVBAR KHI VÀO SESSIONS   */}
            {/* ========================================== */}
            <Route element={<SessionLayout />}>
              <Route
                path="/sessions"
                element={
                  <ProtectedRoute roles={['CANDIDATE']}>
                    <SessionPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* ========================================== */}
            {/* NHÓM 3: COMPONENT CHUNG (KHÔNG BỌC NAVBAR) */}
            {/* ========================================== */}
            <Route
              path="/mentors"
              element={
                <ProtectedRoute roles={['CANDIDATE']}>
                  <MentorListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentors/:id"
              element={
                <ProtectedRoute roles={['CANDIDATE']}>
                  <MentorDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/question-bank"
              element={
                <ProtectedRoute>
                  <QuestionBank />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bookmarks"
              element={
                <ProtectedRoute roles={['CANDIDATE']}>
                  <BookmarkedQuestionsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/questions/:id/:slug"
              element={
                <ProtectedRoute>
                  <QuestionDetailContainer />
                </ProtectedRoute>
              }
            />

            {/* ========================================== */}
            {/* CÁC ROUTE CÒN LẠI CỦA HỆ THỐNG             */}
            {/* ========================================== */}
            {/* Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute roles={['CANDIDATE']}>
                  <Profile />
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
              path="/mentor/sessions"
              element={
                <ProtectedRoute roles={['MENTOR']}>
                  <MentorLayout>
                    <SessionPage />
                  </MentorLayout>
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

            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="mentors" element={<MentorApprovalList />} />
              <Route path="mentors/:id" element={<MentorDetail />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/:id" element={<UserDetail />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="companies" element={<CompaniesPage />} />
              {/* Thêm các route admin khác sau */}
            </Route>

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
