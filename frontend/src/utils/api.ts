// Simple API client based on OauthImplementation.md
import { config } from '../config/environment';

const SUPABASE_URL = config.SUPABASE_URL;
const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;
const API_BASE_URL = config.BACKEND_URL;

// This is the core function that handles API calls and token refreshing.
export async function fetchWithAutoRefresh(url: string, options: RequestInit = {}): Promise<Response> {
  let tokens = await chrome.storage.local.get(["access_token", "refresh_token"]);

  if (!tokens.access_token) {
    console.error("❌ User not authenticated. No access token found.");
    throw new Error("User not authenticated.");
  }

  // Set the authorization header
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json'
    } as HeadersInit;
    
    console.log('📡 FRONTEND: Preparing API request');
    console.log(`   ├─ URL: ${API_BASE_URL}${url}`);
    console.log(`   ├─ Method: ${options.method || 'GET'}`);
    console.log(`   ├─ Access token present: ${!!tokens.access_token}`);
    console.log(`   ├─ Refresh token present: ${!!tokens.refresh_token}`);
    console.log(`   ├─ Authorization header: ${(options.headers as any)['Authorization'] ? 'Bearer ' + (options.headers as any)['Authorization'].toString().substring(7, 27) + '...' : 'Missing'}`);
    console.log(`   └─ All headers:`, Object.keys(options.headers));

  // First attempt
  let response = await fetch(`${API_BASE_URL}${url}`, options);

  // If the token is expired (401), try to refresh it
  if (response.status === 401 && tokens.refresh_token) {
    console.log("🔄 Access token expired. Refreshing tokens...");
    console.log(`🔑 Using refresh token: ${tokens.refresh_token.substring(0, 20)}...`);

    const refreshResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refresh_token: tokens.refresh_token
      }),
    });

    if (!refreshResponse.ok) {
        const errorData = await refreshResponse.text();
        console.error("❌ Failed to refresh token. Response:", refreshResponse.status, errorData);
        // Clear tokens and force re-login
        await chrome.storage.local.remove(["access_token", "refresh_token"]);
        throw new Error("Could not refresh session. Please log in again.");
    }
    
    const newTokens = await refreshResponse.json();
    console.log("✅ New tokens received:");
    console.log(`   - Access Token: ${newTokens.access_token ? newTokens.access_token.substring(0, 20) + '...' : 'Not found'}`);
    console.log(`   - Refresh Token: ${newTokens.refresh_token ? newTokens.refresh_token.substring(0, 20) + '...' : 'Not found'}`);
    
    // Save both the new access token and refresh token
    await chrome.storage.local.set({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || tokens.refresh_token // Use new refresh token if provided, otherwise keep the old one
    });

    console.log("💾 New tokens saved to storage.");
    console.log("🔄 Retrying original request with new access token...");

    // Retry the original request with the new access token
    (options.headers as any)['Authorization'] = `Bearer ${newTokens.access_token}`;
    response = await fetch(`${API_BASE_URL}${url}`, options);
    
    if (response.ok) {
      console.log("✅ Original request succeeded after token refresh.");
    } else {
      console.log(`❌ Original request still failed after token refresh. Status: ${response.status}`);
    }
  }

  return response;
}

// Check authentication status using the backend endpoint
export async function checkAuthStatus() {
    const tokens = await chrome.storage.local.get(["access_token", "refresh_token"]);
    
    // If no access token, return structured response indicating no tokens
    if (!tokens.access_token) {
        console.log('🔍 checkAuthStatus: No access token found in storage');
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
                'Authorization': `Bearer ${tokens.access_token}`
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
    await chrome.storage.local.remove(['access_token', 'refresh_token']);
}
