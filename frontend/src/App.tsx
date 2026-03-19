import { Routes, Route, Navigate } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "../contexts/ThemeContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "../components/ui/tooltip";
import { Toaster } from "../components/ui/toaster";
import { Toaster as Sonner } from "../components/ui/sonner";
import i18n from "../i18n";
import Auth from "./pages/Auth";
import SelectRole from "./pages/SelectRole";
import Dashboard from "./pages/Dashboard";
import Practice from "./pages/Practice";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";


// Pages

const isAuthenticated = () => {
  return localStorage.getItem('user') !== null;
};

const hasSelectedRole = () => {
  const user = localStorage.getItem('user');
  if (!user) return false;
  try {
    const userData = JSON.parse(user);
    return userData.targetRole !== undefined;
  } catch {
    return false;
  }
};

const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  if (!hasSelectedRole()) {
    return <Navigate to="/select-role" replace />;
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
              <Route path="/" element={<Auth />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/select-role" element={isAuthenticated() ? <SelectRole /> : <Navigate to="/login" replace />} />
              <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
              <Route path="/homepage" element={<ProtectedRoute element={<Home />} />} />
              <Route path="/practice" element={<ProtectedRoute element={<Practice />} />} />
              {/* <Route path="/peer-interview" element={<ProtectedRoute element={<PeerInterview />} />} /> */}
              {/* <Route path="/question-bank" element={<ProtectedRoute element={<QuestionBank />} />} /> */}
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
