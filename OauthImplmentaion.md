Directory structure:
└── ansuman-shukla-extension-with-oauth2/
    ├── backend/
    │   ├── main.py
    │   ├── requirements.txt
    │   └── run.py
    └── frontend/
        ├── index.html
        ├── package.json
        ├── vite.config.js
        ├── public/
        │   └── manifest.json
        └── src/
            ├── api.js
            ├── App.css
            ├── App.jsx
            ├── main.jsx
            ├── testTokenRefresh.js
            └── TokenTestComponent.jsx


Files Content:

================================================
FILE: backend/main.py
================================================
# backend/main.py

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from typing import Dict

# --- Configuration ---
SUPABASE_JWT_SECRET = "8w7oje7q+PneOqB+uhXJH6cthaQo6F7WAKEq5XWn3lEN15HAx2f3dhZfdNLwTQ8TqPu+fN36yDbJOABlZcaqZg=="
ALGORITHM = "HS256"
AUDIENCE = "authenticated"

app = FastAPI()

# --- CORS Middleware ---
# Allows the frontend (Chrome extension) to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your extension's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency for JWT Verification ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[ALGORITHM],
            audience=AUDIENCE
        )
        # You can add more validation here if needed (e.g., check 'sub' claim)
        if payload.get("sub") is None:
            raise credentials_exception
        
        return payload
        
    except JWTError as e:
        print(f"JWT Error: {e}") # For debugging
        raise credentials_exception

# --- Protected API Endpoint ---
@app.get("/api/user/profile")
async def get_user_profile(current_user: Dict = Depends(get_current_user)):
    """
    Returns the user's profile information extracted from the JWT.
    The user's full name is typically stored in the 'user_metadata' claim.
    """
    user_metadata = current_user.get("user_metadata", {})
    full_name = user_metadata.get("full_name", "User")
    email = current_user.get("email", "No email provided")
    profile_pic = user_metadata.get("profile_pic", "No profile pic")

    print(f"User logged in: UUID={current_user.get('sub')}, Name={full_name}, Email={email}, Profile Pic={profile_pic}")

    return {"full_name": full_name, "email": email, "sub": current_user.get("sub"), "profile_pic": profile_pic}

@app.get("/")
def read_root():
    return {"status": "Backend is running"}



================================================
FILE: backend/requirements.txt
================================================
fastapi
uvicorn[standard]
python-jose[cryptography]
python-multipart
fastapi-cors



================================================
FILE: backend/run.py
================================================
#!/usr/bin/env python3
# backend/run.py

import uvicorn

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)



================================================
FILE: frontend/index.html
================================================
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Supabase Auth Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>



================================================
FILE: frontend/package.json
================================================
{
  "name": "supabase-auth-chrome-extension",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8"
  }
}



================================================
FILE: frontend/vite.config.js
================================================
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
  },
  publicDir: 'public',
})



================================================
FILE: frontend/public/manifest.json
================================================
{
  "manifest_version": 3,
  "name": "Supabase Auth Demo",
  "version": "1.0",
  "description": "A demo extension for Supabase OAuth with a FastAPI backend.",
  "action": {
    "default_popup": "index.html"
  },
  "permissions": [
    "identity",
    "storage"
  ],
  "host_permissions": [
    "http://127.0.0.1:8000/*"
  ],
  "key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtTCQJG9ku8pF8htahg1yJCESWF7/fiZNpSC/K9bJ5AW742n4z80oMP8+tbGAYNKjx0zJtXJL1sKnTM7Wa3JQLgnuGe4BYM8ySg+pCtgdWT3ZW6ScIec0KNKEfr/DLPSkxwx20LBYzJFSXOlYyzUXn5h2lKZ9voHx8+z5/F2CXXtgeENjFA4QSejQJJ9JgseTPDsdYhO6GyHJtW6qKXmBwuhv6/IqwDZupb2tLIiSC/kYVtKpbbej9Rg9cJiJx//UrJtyHC9nppOCFhChG50p+0HnKhW++8CCUiDmfRdfVvfffl1f+1FbCziTchRO3oUzHAPF6XjBxk9tO4GhDyc3MwIDAQAB"
}



================================================
FILE: frontend/src/api.js
================================================
// frontend/src/api.js

const SUPABASE_URL = "https://dzftiemmhvmtrlooukqd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6ZnRpZW1taHZtdHJsb291a3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2MTQ5NjEsImV4cCI6MjA1NDE5MDk2MX0.pFPUNjrL52biBlNmwcSwJRxhQ7mx1Elqnh_6OOVABM4";
const API_BASE_URL = "http://127.0.0.1:8000";

// This is the core function that handles API calls and token refreshing.
export async function fetchWithAutoRefresh(url, options = {}) {
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
    };
    console.log('📥 API Request Headers:', options.headers);

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
    options.headers['Authorization'] = `Bearer ${newTokens.access_token}`;
    response = await fetch(`${API_BASE_URL}${url}`, options);
    
    if (response.ok) {
      console.log("✅ Original request succeeded after token refresh.");
    } else {
      console.log(`❌ Original request still failed after token refresh. Status: ${response.status}`);
    }
  }

  return response;
}

// A specific function to get the user profile
export async function getUserProfile() {
    const response = await fetchWithAutoRefresh('/api/user/profile');
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch user profile.");
    }
    return response.json();
}



================================================
FILE: frontend/src/App.css
================================================
/* frontend/src/App.css */

.container {
  width: 350px;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background-color: #f8f9fa;
  min-height: 200px;
  box-sizing: border-box;
}

h1 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
  text-align: center;
}

.error {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 14px;
}

.profile {
  text-align: center;
}

.profile p {
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.login {
  text-align: center;
}

.login p {
  margin-bottom: 15px;
  color: #666;
  font-size: 14px;
}

button {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  min-width: 120px;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #3367d6;
}

button:active {
  background-color: #2851a3;
}



================================================
FILE: frontend/src/App.jsx
================================================
// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import { getUserProfile } from './api';
import TokenTestComponent from './TokenTestComponent';
import './App.css';

const SUPABASE_URL = "https://dzftiemmhvmtrlooukqd.supabase.co";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in on component mount
    const checkUser = async () => {
      console.log('🔍 Checking if user is already logged in...');
      try {
        const profile = await getUserProfile();
        console.log('✅ User already logged in:', profile);
        setUser(profile);
      } catch (e) {
        console.log('❌ User not logged in or token invalid:', e.message);
        setUser(null); // Not logged in or token invalid
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);
  
  const handleLogin = () => {
    const redirectUri = chrome.identity.getRedirectURL();
    const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;

    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true,
    }, async (redirectedTo) => {
      if (chrome.runtime.lastError || !redirectedTo) {
        console.log('❌ Login failed:', chrome.runtime.lastError?.message || 'Please try again.');
        setError("Login failed. " + (chrome.runtime.lastError?.message || "Please try again."));
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
        
        // Fetch profile immediately after login
        setLoading(true);
        console.log('👤 Fetching user profile...');
        try {
          const profile = await getUserProfile();
          console.log('✅ User profile fetched successfully:', profile);
          setUser(profile);
          setError('');
        } catch (e) {
          console.log('❌ Failed to fetch user profile:', e.message);
          setError(e.message);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('❌ Token extraction failed - missing tokens');
        setError("Could not retrieve tokens from Supabase.");
      }
    });
  };

  const handleLogout = async () => {
    await chrome.storage.local.remove(['access_token', 'refresh_token']);
    setUser(null);
    setError('');
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Auth Demo</h1>
      {error && <p className="error">{error}</p>}
      {user ? (
        <div className="profile">
          <p>Welcome, <strong>{user.full_name || user.email}</strong>!</p>
          <button onClick={handleLogout}>Logout</button>
          
          {/* Token Testing Component - only show when logged in */}
          <TokenTestComponent />
        </div>
      ) : (
        <div className="login">
          <p>You are not logged in.</p>
          <button onClick={handleLogin}>Login with Google</button>
        </div>
      )}
    </div>
  );
}

export default App;



================================================
FILE: frontend/src/main.jsx
================================================
// frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



================================================
FILE: frontend/src/testTokenRefresh.js
================================================
import { fetchWithAutoRefresh } from './api';

async function testTokenRefresh() {
  console.log('🔍 Starting Token Refresh Test');

  // Simulate API call to check refresh token handling
  try {
    const response = await fetchWithAutoRefresh('/api/user/profile');

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token Refresh Success:', data);
    } else {
      console.log('❌ Token refresh failed with status:', response.status);
    }
  } catch (error) {
    console.error('❌ Error during token refresh test:', error.message);
  }
}

// Call the test function
testTokenRefresh();




================================================
FILE: frontend/src/TokenTestComponent.jsx
================================================
import React, { useState } from 'react';
import { fetchWithAutoRefresh } from './api';

const TokenTestComponent = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addTestResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testAccessToken = async () => {
    setLoading(true);
    addTestResult('🔍 Testing Access Token...', 'info');

    try {
      const tokens = await chrome.storage.local.get(['access_token', 'refresh_token']);
      
      if (!tokens.access_token) {
        addTestResult('❌ No access token found. Please login first.', 'error');
        setLoading(false);
        return;
      }

      addTestResult(`✅ Access token found: ${tokens.access_token.substring(0, 20)}...`, 'success');
      addTestResult(`✅ Refresh token found: ${tokens.refresh_token ? tokens.refresh_token.substring(0, 20) + '...' : 'Not found'}`, 'success');

      // Test API call with current token
      const response = await fetchWithAutoRefresh('/api/user/profile');
      
      if (response.ok) {
        const data = await response.json();
        addTestResult('✅ API call successful with current access token', 'success');
        addTestResult(`👤 User: ${data.full_name} (${data.email})`, 'info');
      } else {
        addTestResult(`❌ API call failed with status: ${response.status}`, 'error');
      }

    } catch (error) {
      addTestResult(`❌ Error: ${error.message}`, 'error');
    }

    setLoading(false);
  };

  const expireFakeToken = async () => {
    addTestResult('🔧 Simulating expired access token...', 'info');
    
    // Set a fake expired token to trigger refresh
    await chrome.storage.local.set({ 
      access_token: 'fake_expired_token'
    });
    
    addTestResult('✅ Access token set to fake expired token', 'success');
  };

  const testRefreshToken = async () => {
    setLoading(true);
    addTestResult('🔄 Testing Refresh Token Flow...', 'info');

    try {
      // This should trigger the refresh flow since we have a fake expired token
      const response = await fetchWithAutoRefresh('/api/user/profile');
      
      if (response.ok) {
        const data = await response.json();
        addTestResult('✅ Refresh token flow successful!', 'success');
        addTestResult(`👤 User: ${data.full_name} (${data.email})`, 'info');
        
        // Show new tokens
        const newTokens = await chrome.storage.local.get(['access_token', 'refresh_token']);
        addTestResult(`🔑 New access token: ${newTokens.access_token.substring(0, 20)}...`, 'info');
      } else {
        addTestResult(`❌ Refresh token flow failed with status: ${response.status}`, 'error');
      }

    } catch (error) {
      addTestResult(`❌ Refresh token error: ${error.message}`, 'error');
    }

    setLoading(false);
  };

  const viewStoredTokens = async () => {
    const tokens = await chrome.storage.local.get(['access_token', 'refresh_token']);
    
    addTestResult('📋 Current Stored Tokens:', 'info');
    addTestResult(`   Access Token: ${tokens.access_token ? tokens.access_token.substring(0, 50) + '...' : 'Not found'}`, 'info');
    addTestResult(`   Refresh Token: ${tokens.refresh_token ? tokens.refresh_token.substring(0, 50) + '...' : 'Not found'}`, 'info');
  };

  const clearTokens = async () => {
    await chrome.storage.local.remove(['access_token', 'refresh_token']);
    addTestResult('🗑️ All tokens cleared from storage', 'warning');
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px 0', borderRadius: '5px' }}>
      <h3>🧪 Token Testing Panel</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <button onClick={testAccessToken} disabled={loading} style={{ margin: '5px' }}>
          Test Access Token
        </button>
        <button onClick={expireFakeToken} disabled={loading} style={{ margin: '5px' }}>
          Simulate Expired Token
        </button>
        <button onClick={testRefreshToken} disabled={loading} style={{ margin: '5px' }}>
          Test Refresh Flow
        </button>
        <button onClick={viewStoredTokens} style={{ margin: '5px' }}>
          View Stored Tokens
        </button>
        <button onClick={clearTokens} style={{ margin: '5px', backgroundColor: '#ff6b6b', color: 'white' }}>
          Clear All Tokens
        </button>
        <button onClick={clearResults} style={{ margin: '5px' }}>
          Clear Results
        </button>
      </div>

      {loading && <p>🔄 Testing in progress...</p>}

      <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '3px' }}>
        {testResults.length === 0 ? (
          <p style={{ color: '#666' }}>No test results yet. Click a button to start testing.</p>
        ) : (
          testResults.map((result, index) => (
            <div key={index} style={{ 
              marginBottom: '5px', 
              color: result.type === 'error' ? '#d63031' : result.type === 'success' ? '#00b894' : result.type === 'warning' ? '#fdcb6e' : '#2d3436',
              fontSize: '14px'
            }}>
              <span style={{ opacity: 0.7 }}>[{result.timestamp}]</span> {result.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TokenTestComponent;


