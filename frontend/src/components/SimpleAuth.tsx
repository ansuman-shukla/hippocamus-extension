// Simple authentication hook based on OauthImplementation.md

import React, { useState, useEffect } from 'react';
import { logout, checkAuthStatus } from '../utils/api';

// Extend Window interface to include our auth check flag
declare global {
  interface Window {
    authChecked?: boolean;
  }
}

const SUPABASE_URL = "https://dzftiemmhvmtrlooukqd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6ZnRpZW1taHZtdHJsb291a3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2MTQ5NjEsImV4cCI6MjA1NDE5MDk2MX0.pFPUNjrL52biBlNmwcSwJRxhQ7mx1Elqnh_6OOVABM4";

// Function to refresh tokens
async function refreshTokens(refreshToken: string) {
  const refreshResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refresh_token: refreshToken
    }),
  });

  if (!refreshResponse.ok) {
    const errorData = await refreshResponse.text();
    throw new Error(`Token refresh failed: ${refreshResponse.status} ${errorData}`);
  }
  
  const newTokens = await refreshResponse.json();
  
  // Save both the new access token and refresh token
  await chrome.storage.local.set({
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token || refreshToken
  });
  
  return newTokens;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  sub?: string;
  profile_pic?: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

export function useSimpleAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Prevent duplicate auth checks by using a global flag
    if (window.authChecked) {
      console.log('🔍 Auth check already performed, skipping duplicate check');
      setLoading(false);
      return;
    }
    
    window.authChecked = true;
    
    // Check if user is already logged in on component mount
    const checkUser = async () => {
      console.log('🔍 Checking if user is already logged in...');
      
      try {
        const tokens = await chrome.storage.local.get(["access_token", "refresh_token"]);
        
        if (!tokens.access_token) {
          console.log('❌ No access token found');
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Check auth status with backend
        const authStatus = await checkAuthStatus();
        console.log('🔍 Auth status response:', authStatus);
        console.log('🔍 Auth status - is_authenticated:', authStatus.is_authenticated, 'token_valid:', authStatus.token_valid);
        
        if (authStatus.is_authenticated && authStatus.token_valid) {
          console.log('✅ User is authenticated and token is valid');
          const profile = {
            id: authStatus.user_id,
            sub: authStatus.user_id,
            email: authStatus.user_email,
            full_name: authStatus.full_name || authStatus.user_name,
            profile_pic: authStatus.picture || authStatus.user_picture
          };
          setUser(profile);
        } else if (authStatus.has_access_token === false && authStatus.has_refresh_token === false) {
          console.log('❌ No tokens on backend, need to re-authenticate');
          // Clear local tokens and redirect to auth
          await chrome.storage.local.remove(['access_token', 'refresh_token']);
          setUser(null);
        } else {
          console.log('❌ Token invalid or user not authenticated. Checking if we can refresh...');
          console.log('🔄 Refresh token available:', !!tokens.refresh_token);
          // Try to refresh token if we have a refresh token
          if (tokens.refresh_token) {
            console.log('🔄 Starting token refresh process...');
            try {
              console.log('🔄 Calling refreshTokens function...');
              await refreshTokens(tokens.refresh_token);
              console.log('✅ Token refresh completed successfully');
              // After refresh, try checking auth status again
              console.log('🔄 Rechecking auth status after token refresh...');
              const newAuthStatus = await checkAuthStatus();
              console.log('🔄 New auth status:', newAuthStatus.is_authenticated);
              if (newAuthStatus.is_authenticated) {
                const profile = {
                  id: newAuthStatus.user_id,
                  sub: newAuthStatus.user_id,
                  email: newAuthStatus.user_email,
                  full_name: newAuthStatus.full_name || newAuthStatus.user_name,
                  profile_pic: newAuthStatus.picture || newAuthStatus.user_picture
                };
                setUser(profile);
              } else {
                setUser(null);
              }
            } catch (refreshError: any) {
              console.log('❌ Token refresh failed:', refreshError.message);
              await chrome.storage.local.remove(['access_token', 'refresh_token']);
              setUser(null);
            }
          } else {
            console.log('❌ No refresh token available, setting user to null');
            setUser(null);
          }
        }
      } catch (e: any) {
        console.log('❌ Auth check failed (outer catch):', e.message);
        console.log('❌ This means checkAuthStatus threw an error, not the backend response');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);
  
  const handleLogin = (): Promise<AuthResult> => {
    return new Promise((resolve) => {
      const redirectUri = chrome.identity.getRedirectURL();
      const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;

      chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true,
      }, async (redirectedTo) => {
        if (chrome.runtime.lastError || !redirectedTo) {
          console.log('❌ Login failed:', chrome.runtime.lastError?.message || 'Please try again.');
          const errorMsg = "Login failed. " + (chrome.runtime.lastError?.message || "Please try again.");
          setError(errorMsg);
          resolve({ success: false, error: errorMsg });
          return;
        }
        
        console.log('🔗 Redirect URL received:', redirectedTo);
        
        const url = new URL(redirectedTo);
        const fragment = new URLSearchParams(url.hash.substring(1));
        const accessToken = fragment.get('access_token');
        const refreshToken = fragment.get('refresh_token');
        
        console.log('🔑 Token extraction results:');
        console.log(`   - Access Token: ${accessToken ? accessToken.substring(0, 20) + '...' : 'Not found'}`);
        console.log(`   - Refresh Token: ${refreshToken ? refreshToken.substring(0, 20) + '...' : 'Not found'}`);

        if (accessToken && refreshToken) {
          console.log('💾 Storing tokens in chrome.storage.local...');
          await chrome.storage.local.set({ access_token: accessToken, refresh_token: refreshToken });
          console.log('✅ Tokens stored successfully');
          
          // Set a basic user object to mark as authenticated
          setUser({ id: 'authenticated', email: '', full_name: 'User' });
          setError('');
          resolve({ success: true });
        } else {
          console.log('❌ Token extraction failed - missing tokens');
          const errorMsg = "Could not retrieve tokens from Supabase.";
          setError(errorMsg);
          resolve({ success: false, error: errorMsg });
        }
      });
    });
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setError('');
  };

  // Check if user is authenticated (has tokens)
  const isAuthenticated = () => {
    return user !== null;
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: isAuthenticated(),
    login: handleLogin,
    logout: handleLogout
  };
}

// Simple component that uses the hook for backward compatibility
interface SimpleAuthProps {
  children?: (auth: ReturnType<typeof useSimpleAuth>) => React.ReactNode;
}

export default function SimpleAuth({ children }: SimpleAuthProps) {
  const auth = useSimpleAuth();
  
  if (auth.loading) {
    return <div>Loading...</div>;
  }
  
  return children ? children(auth) : null;
}
