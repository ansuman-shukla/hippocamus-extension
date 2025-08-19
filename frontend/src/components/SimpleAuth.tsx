// Simple authentication hook based on OauthImplementation.md

import React, { useState, useEffect } from 'react';
import { logout, checkAuthStatus } from '../utils/api';
import { config } from '../config/environment';
import { supabase, getValidAccessToken, ensureSupabaseSessionFromStoredTokens } from '../supabaseClient';

// Extend Window interface to include our auth check flag
declare global {
  interface Window {
    authChecked?: boolean;
  }
}

const SUPABASE_URL = config.SUPABASE_URL;

// Removed manual refreshTokens; Supabase client will auto-refresh

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
      // console.log('🔍 Auth check already performed, skipping duplicate check');
      setLoading(false);
      return;
    }
    
    window.authChecked = true;
    
    const checkUser = async () => {
      // console.log('🔍 Checking if user is already logged in...');
      
      try {
        // Ensure supabase session is initialized from stored tokens (extension env)
        await ensureSupabaseSessionFromStoredTokens();

        // Let backend validate and also gives us metadata
        const authStatus = await checkAuthStatus();
        // console.log('🔍 Auth status response:', authStatus);
        
        if (authStatus.is_authenticated && authStatus.token_valid) {
          // console.log('✅ User is authenticated and token is valid');
          const profile = {
            id: authStatus.user_id,
            sub: authStatus.user_id,
            email: authStatus.user_email,
            full_name: authStatus.full_name || authStatus.user_name,
            profile_pic: authStatus.picture || authStatus.user_picture
          };
          setUser(profile);
          
        } else if (!authStatus.token_valid && authStatus.has_refresh_token) {
          // console.log('🔄 Token invalid. Letting Supabase refresh the session...');
          await getValidAccessToken();
          const newAuthStatus = await checkAuthStatus();
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
            await chrome.storage.local.remove(["access_token", "refresh_token"]);
            setUser(null);
          }
        } else {
          // console.log('❌ No valid session. Tokens will be cleared.');
          await chrome.storage.local.remove(["access_token", "refresh_token"]);
          setUser(null);
        }
        
      } catch (e: any) {
        // console.log('❌ Auth check failed (outer catch):', e.message);
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
          // console.log('❌ Login failed:', chrome.runtime.lastError?.message || 'Please try again.');
          const errorMsg = "Login failed. " + (chrome.runtime.lastError?.message || "Please try again.");
          setError(errorMsg);
          resolve({ success: false, error: errorMsg });
          return;
        }
        
        // console.log('🔗 Redirect URL received:', redirectedTo);
        
        const url = new URL(redirectedTo);
        const fragment = new URLSearchParams(url.hash.substring(1));
        const accessToken = fragment.get('access_token');
        const refreshToken = fragment.get('refresh_token');
        
        // console.log('🔑 Token extraction results:');
        // console.log(`   - Access Token: ${accessToken ? accessToken.substring(0, 20) + '...' : 'Not found'}`);
        // console.log(`   - Refresh Token: ${refreshToken ? refreshToken.substring(0, 20) + '...' : 'Not found'}`);

        if (accessToken && refreshToken) {
          // console.log('🔐 Setting Supabase session from tokens...');
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          const profileStatus = await checkAuthStatus();
          if (profileStatus.is_authenticated) {
            setUser({ id: profileStatus.user_id, email: profileStatus.user_email, full_name: profileStatus.full_name || 'User' });
            setError('');
            resolve({ success: true });
          } else {
            resolve({ success: false, error: 'Auth validation failed after setting session' });
          }
        } else {
          // console.log('❌ Token extraction failed - missing tokens');
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
