import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSimpleAuth } from './SimpleAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading: isLoading } = useSimpleAuth();

  console.log('🛡️ PROTECTED_ROUTE: Checking access', { isAuthenticated, isLoading });

  // Show loading while checking authentication status
  if (isLoading) {
    console.log('⏳ PROTECTED_ROUTE: Still loading auth status');
    return (
      <div className="h-[500px] w-[420px] bg-white rounded-lg border border-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to intro page if not authenticated
  if (!isAuthenticated) {
    console.log('🚫 PROTECTED_ROUTE: User not authenticated, redirecting to intro');
    return <Navigate to="/" replace />;
  }

  console.log('✅ PROTECTED_ROUTE: User authenticated, allowing access');
  return <>{children}</>;
};

export default ProtectedRoute;
