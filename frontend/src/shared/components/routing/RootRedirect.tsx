// src/shared/components/routing/RootRedirect.tsx

import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth';

export default function RootRedirect() {
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

  switch (user.role) {
    case 'MENTOR':
      return <Navigate to="/mentor/dashboard" replace />;

    case 'ADMIN':
    case 'STAFF':
      return <Navigate to="/admin/dashboard" replace />;

    case 'CANDIDATE':
    default:
      return <Navigate to="/home" replace />;
  }
}
