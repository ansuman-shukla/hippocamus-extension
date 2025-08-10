// Simple API client based on OauthImplementation.md
import { config } from '../config/environment';
import { getValidAccessToken } from '../supabaseClient';

// Using Supabase client helpers instead of manual refresh
const API_BASE_URL = config.BACKEND_URL;

// This is the core function that handles API calls and token refreshing.
export async function fetchWithAutoRefresh(url: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error('User not authenticated.');
  }
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  } as HeadersInit;
  return fetch(`${API_BASE_URL}${url}`, options);
}

// Check authentication status using the backend endpoint
export async function checkAuthStatus() {
    const tokens = await chrome.storage.local.get(["access_token", "refresh_token"]);
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return {
        has_access_token: false,
        has_refresh_token: !!tokens.refresh_token,
        is_authenticated: false,
        user_id: null,
        token_valid: false
      };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/status`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();
        
        // Add frontend refresh token info since backend doesn't receive it
        data.has_refresh_token = !!tokens.refresh_token;
        
        console.log('🔍 checkAuthStatus: Response received:', response.status);
        return data;
        
    } catch (error: any) {
        console.log('🔍 checkAuthStatus: Network error:', error.message);
        return {
            has_access_token: true,
            has_refresh_token: !!tokens.refresh_token,
            is_authenticated: false,
            user_id: null,
            token_valid: false,
            network_error: true
        };
    }
}


// Simple logout function
export async function logout() {
    try { await (await import('../supabaseClient')).supabase.auth.signOut(); } catch {}
    await chrome.storage.local.remove(['access_token', 'refresh_token']);
}
