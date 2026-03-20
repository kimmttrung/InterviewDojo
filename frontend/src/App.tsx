import { Routes, Route, Navigate } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "../contexts/ThemeContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "../components/ui/tooltip";
import { Toaster } from "../components/ui/toaster";
import { Toaster as Sonner } from "../components/ui/sonner";
import i18n from "../i18n";
import SelectRole from "./pages/SelectRole";
import Dashboard from "./pages/Dashboard";
import Practice from "./pages/Practice";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import QuestionBank from "./pages/QuestionBank";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";


interface ProtectedRouteProps {
  element: React.ReactNode;
  roles?: string[]; // optional, chỉ định role được phép
}

const ProtectedRoute = ({ element, roles }: ProtectedRouteProps) => {
  const userStore = localStorage.getItem('user');
  if (!userStore) return <Navigate to="/login" replace />

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
            <Sonner
              position="top-right"
              duration={3000}
              richColors
              closeButton
            />
            <Routes>
              <Route path="*" element={<NotFound />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/select-role"
                element={
                  (() => {
                    const userStore = localStorage.getItem('user');
                    if (!userStore) return <Navigate to="/login" replace />;

                    const user = JSON.parse(userStore);

                    // đã chọn role rồi → không cho vào lại
                    if (!user.targetRole) {
                      return <SelectRole />;
                    } else {
                      return <Home />
                    }

                  })()
                }
              />
              <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
              <Route path="/" element={<ProtectedRoute element={<Home />} />} />
              <Route path="/practice" element={<ProtectedRoute element={<Practice />} roles={['candidate']} />} />
              <Route path="/question-bank" element={<ProtectedRoute element={<QuestionBank />} />} />
              {/* <Route path="/peer-interview" element={<ProtectedRoute element={<PeerInterview />} />} /> */}
              {/* <Route path="/feedback" element={<ProtectedRoute element={<Feedback />} />} /> */}
              {/* <Route path="/analytics" element={<ProtectedRoute element={<Analytics />} />} /> */}
              {/* <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} /> */}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              {/* <Route path="*" element={<NotFound />} /> */}
            </Routes>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
