import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSimpleAuth } from './SimpleAuth';
import AuthLoadingIndicator from './AuthLoadingIndicator';

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
      <AuthLoadingIndicator message="Hold on" />
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
