// Configuration - will be replaced during build
const BACKEND_URL = '__VITE_BACKEND_URL__';

// Silence non-critical logs in production
if (typeof console !== 'undefined') {
  // Keep errors and warnings; silence verbose logs
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkAuthStatus") {
    chrome.storage.local.get(['access_token', 'refresh_token'], (result) => {
      const { access_token, refresh_token } = result;
      if (!access_token || !refresh_token) {
        // console.log('No valid tokens found, starting auth flow');
        startAuthFlow();
      } else {
        // console.log('Valid tokens found');
      }
    });
  }
});

// Add runtime startup event listener
chrome.runtime.onStartup.addListener(() => {
  // console.log('🔄 BACKGROUND: Extension runtime started');
});

chrome.runtime.onInstalled.addListener((details) => {
  // console.log('📦 BACKGROUND: Extension installed/updated');
  // console.log(`   ├─ Reason: ${details.reason}`);
  // console.log(`   ├─ Previous version: ${details.previousVersion || 'N/A'}`);
  
});

// Helper function to notify frontend of authentication failures
async function notifyAuthenticationFailure(reason = 'Authentication failed') {
  // console.log('🚫 BACKGROUND: Notifying frontend of authentication failure');
  try {
    // Get all extension tabs/windows
    const tabs = await chrome.tabs.query({});
    
    // Send message to all extension contexts
    for (const tab of tabs) {
      if (tab.url && tab.url.includes('chrome-extension://')) {
        try {
          await chrome.tabs.sendMessage(tab.id, { 
            action: "authenticationFailed", 
            reason: reason 
          });
          // console.log(`   ├─ Notified tab ${tab.id} of auth failure`);
        } catch (error) {
          // Ignore errors if tab is not ready to receive messages
          // console.log(`   ├─ Could not notify tab ${tab.id}: ${error.message}`);
        }
      }
    }
    
    // console.log('✅ BACKGROUND: Authentication failure notifications sent');
  } catch (error) {
    console.error('❌ BACKGROUND: Failed to notify frontend of auth failure:', error);
  }
}

// Generic helper function for making API calls with auth failure detection
async function makeAuthenticatedRequest(url, options, actionName, maxRetries = 3) {
  let retryCount = 0;
  let lastStatusCode = null;
  
  while (retryCount < maxRetries) {
    try {
      // Attach Authorization header from stored Supabase session tokens (kept in sync by UI)
      const tokens = await chrome.storage.local.get(['access_token']);
      const mergedHeaders = {
        'Content-Type': 'application/json',
        ...(tokens && tokens.access_token ? { 'Authorization': `Bearer ${tokens.access_token}` } : {}),
        ...(options && options.headers ? options.headers : {})
      };
      const { headers: _ignored, ...rest } = options || {};
      const response = await fetch(url, {
        credentials: 'include',
        ...rest,
        headers: mergedHeaders
      });
      
      lastStatusCode = response.status;
      
      if (response.ok) {
        // console.log(`✅ BACKGROUND: ${actionName} successful`);
        return await response.json();
      } else if (response.status === 401 && retryCount < maxRetries - 1) {
        // console.log(`⚠️  BACKGROUND: ${actionName} got 401, retry ${retryCount + 1}/${maxRetries}`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      } else {
        throw new Error(`${actionName} failed: ${response.status}`);
      }
    } catch (error) {
      if (retryCount < maxRetries - 1) {
        // console.log(`⚠️  BACKGROUND: ${actionName} error, retry ${retryCount + 1}/${maxRetries}:`, error.message);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      } else {
        // Check if all retries failed due to authentication issues
        if (lastStatusCode === 401 || error.message.includes('401')) {
          // console.log(`🚫 BACKGROUND: ${actionName} failed with authentication error after all retries`);
          notifyAuthenticationFailure(`${actionName} authentication failed after ${maxRetries} retries`);
        }
        throw new Error(`${actionName} failed after ${maxRetries} retries: ${error.message}`);
      }
    }
  }
}

// Multi-domain cookie cleanup function
async function clearAllAuthCookies() {
  // console.log('🧹 BACKGROUND: Starting comprehensive cookie cleanup across all domains');
  
  // All domains where auth cookies might exist
  const domains = (() => {
    const urls = [BACKEND_URL].filter(Boolean);
    try {
      return Array.from(new Set(urls.map(u => new URL(u).origin)));
    } catch {
      return urls;
    }
  })();
  
  // All possible auth cookie names
  const authCookieNames = [
    'access_token',
    'refresh_token',
    'user_id',
    'user_name',
    'user_picture'
  ];
  
  for (const domain of domains) {
    // console.log(`   ├─ Clearing cookies from domain: ${domain}`);
    for (const cookieName of authCookieNames) {
      try {
        await chrome.cookies.remove({
          url: domain,
          name: cookieName
        });
        // console.log(`   │  ✓ Cleared ${cookieName} from ${domain}`);
      } catch (error) {
        console.warn(`   │  ⚠️  Failed to clear ${cookieName} from ${domain}:`, error);
      }
    }
  }
  
  // console.log('✅ BACKGROUND: Multi-domain cookie cleanup completed');
}

// Register keyboard command listener
chrome.commands.onCommand.addListener((command) => {
  // console.log('⌨️ BACKGROUND: Keyboard command received:', command);
  
  if (command === '_execute_action') {
    // This is handled by chrome.action.onClicked listener below
    // console.log('   ├─ Alt+M shortcut triggered, delegating to action handler');
  }
});

// Test that action listener is registered
// console.log('📋 BACKGROUND: Registering chrome.action.onClicked listener...');

// STEP 1: Alt+M Extension Action Handler
// This fires when the user clicks the extension icon OR presses Alt+M
chrome.action.onClicked.addListener((tab) => {
  // console.log('🔥 BACKGROUND STEP 1: Extension action triggered (Alt+M or icon click)');
  // console.log(`   ├─ Tab ID: ${tab.id}`);
  // console.log(`   ├─ Tab URL: ${tab.url}`);
  // console.log(`   ├─ Current time: ${new Date().toISOString()}`);
  // console.log('   ├─ This confirms the action listener is working!');
  
  // console.log('🎨 BACKGROUND STEP 2: Injecting CSS styles into target tab');
  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["content.css"]
  }).then(() => {
    // console.log('✅ BACKGROUND STEP 2: CSS injection completed successfully');
  }).catch((error) => {
    console.error('❌ BACKGROUND STEP 2: CSS injection failed:', error);
  });

  // console.log('📜 BACKGROUND STEP 3: Executing content script in target tab');
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  }).then(() => {
    // console.log('✅ BACKGROUND STEP 3: Content script execution completed successfully');
    // console.log('   ├─ The content script should now toggle the sidebar');
    // console.log('   ├─ Check the tab console for content script logs');
  }).catch((error) => {
    console.error('❌ BACKGROUND STEP 3: Content script execution failed:', error);
  });
});

// console.log('✅ BACKGROUND: chrome.action.onClicked listener registered successfully');

// Removed context menu test code to drop the contextMenus permission







chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "searchAll") {
    // Make requests sequentially to avoid race conditions with token refresh
    async function fetchAllData() {
      try {
        // console.log('🔍 BACKGROUND: Starting searchAll request');
        
        // Make both API calls in parallel using the new helper function
        // console.log('🚀 BACKGROUND: Starting parallel fetch for links and notes');
        const [linksData, notesData] = await Promise.all([
          makeAuthenticatedRequest(`${BACKEND_URL}/links/get`, { method: 'GET' }, 'Links fetch'),
          makeAuthenticatedRequest(`${BACKEND_URL}/notes/`, { method: 'GET' }, 'Notes fetch')
        ]);
        
        // console.log('📦 BACKGROUND: Links data received');
        // console.log('📦 BACKGROUND: Notes data received');
        
        // console.log('✅ BACKGROUND: SearchAll completed successfully');
        sendResponse({ success: true, links: linksData, notes: notesData });
      } catch (error) {
        console.error('❌ BACKGROUND: SearchAll error:', error);
        sendResponse({ success: false, error: error.message });
      }
    }
    
    fetchAllData();
    return true;
  }

  else if (message.action === "search") {
    async function performSearch() {
      try {
        // console.log('🔍 BACKGROUND: Starting search request');
        
        const requestBody = {
          query: message.query
        };

        if (message.type !== "All") {
          requestBody.filter = { type: { $eq: message.type } };
        }

        const data = await makeAuthenticatedRequest(
          `${BACKEND_URL}/links/search`,
          {
            method: 'POST',
            body: JSON.stringify(requestBody)
          },
          'Search'
        );
        // console.log("✅ BACKGROUND: Search response received:", data);
        sendResponse({ success: true, data });
      } catch (error) {
        console.error("❌ BACKGROUND: Search error:", error);
        sendResponse({ success: false, error: error.message });
      }
    }
    
    performSearch();
    return true;
  }

  else if (message.action === "submit") {
    async function performSubmit() {
      try {
        // console.log('📤 BACKGROUND: Starting submit request');
        
        const data = await makeAuthenticatedRequest(
          `${BACKEND_URL}/links/save`,
          {
            method: 'POST',
            body: JSON.stringify(message.data)
          },
          'Submit'
        );
        
        // console.log("✅ BACKGROUND: Submit success:", data);
        sendResponse({ success: true, data });
      } catch (error) {
        console.error("❌ BACKGROUND: Submission error:", error);
        sendResponse({ success: false, error: error.message });
      }
    }
    
    performSubmit();
    return true;
  }
  else if (message.action === "saveNotes") {
    async function performSaveNotes() {
      try {
        // console.log('📝 BACKGROUND: Starting saveNotes request');
        
        let response;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            // Get tokens from chrome.storage.local
            const tokens = await chrome.storage.local.get(["access_token", "refresh_token"]);
            const headers = { 'Content-Type': 'application/json' };
            
            // Add Authorization header if token exists
            if (tokens.access_token) {
              headers['Authorization'] = `Bearer ${tokens.access_token}`;
              // console.log('🔑 BACKGROUND: Added Authorization header to saveNotes request');
            } else {
              // console.log('⚠️  BACKGROUND: No access token found in storage for saveNotes');
            }
            
            response = await fetch(`${BACKEND_URL}/notes/`, {
              method: 'POST',
              credentials: 'include',
              headers: headers,
              body: JSON.stringify(message.data)
            });
            
            // console.log(`📝 BACKGROUND: SaveNotes response status: ${response.status}`);
            
            if (response.ok) {
              // console.log('✅ BACKGROUND: SaveNotes successful');
              break; // Success, exit retry loop
            } else if (response.status === 401 && retryCount < maxRetries - 1) {
              // console.log(`⚠️  BACKGROUND: SaveNotes got 401, retry ${retryCount + 1}/${maxRetries}`);
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            } else {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          } catch (error) {
            if (retryCount < maxRetries - 1) {
              // console.log(`⚠️  BACKGROUND: SaveNotes error, retry ${retryCount + 1}/${maxRetries}:`, error.message);
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            } else {
              throw error;
            }
          }
        }
        
        if (!response || !response.ok) {
          throw new Error(`SaveNotes failed after ${maxRetries} retries`);
        }
        
        const data = await response.json();
        // console.log("✅ BACKGROUND: SaveNotes success:", data);
        sendResponse({ success: true, data });
      } catch (error) {
        console.error("❌ BACKGROUND: SaveNotes error:", error);
        sendResponse({ success: false, error: error.message });
      }
    }
    
    performSaveNotes();
    return true;
  }

  else if (message.action === "getQuotes") {
    async function performGetQuotes() {
      try {
        // console.log('💬 BACKGROUND: Starting getQuotes request');
        
        const data = await makeAuthenticatedRequest(
          `${BACKEND_URL}/quotes/`,
          { method: 'GET' },
          'GetQuotes'
        );
        
        // console.log('✅ BACKGROUND: GetQuotes response received');
        sendResponse({ success: true, data });
      } catch (error) {
        console.error('❌ BACKGROUND: GetQuotes error:', error);
        sendResponse({ success: false, error: error.message });
      }
    }
    
    performGetQuotes();
    return true;
  }
  
  else if (message.action === "delete") {
    async function performDelete() {
      try {
        // console.log('🗑️ BACKGROUND: Starting delete request');
        
        let response;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            response = await fetch(`${BACKEND_URL}/links/delete?doc_id_pincone=${encodeURIComponent(message.query)}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            
            if (response.ok) {
              // console.log('✅ BACKGROUND: Delete successful');
              break; // Success, exit retry loop
            } else if (response.status === 401 && retryCount < maxRetries - 1) {
              // console.log(`⚠️  BACKGROUND: Delete got 401, retry ${retryCount + 1}/${maxRetries}`);
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            } else {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          } catch (error) {
            if (retryCount < maxRetries - 1) {
              // console.log(`⚠️  BACKGROUND: Delete error, retry ${retryCount + 1}/${maxRetries}:`, error.message);
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            } else {
              throw error;
            }
          }
        }
        
        if (!response || !response.ok) {
          throw new Error(`Delete failed after ${maxRetries} retries`);
        }
        
        const data = await response.json();
        // console.log('✅ BACKGROUND: Delete response received');
        sendResponse({ success: true, data });
      } catch (error) {
        console.error('❌ BACKGROUND: Delete error:', error);
        sendResponse({ success: false, error: error.message });
      }
    }
    
    performDelete();
    return true;
  }
  
  else if (message.action === "deleteNote") {
    async function performDeleteNote() {
      try {
        // console.log('🗑️ BACKGROUND: Starting deleteNote request');
        
        let response;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            response = await fetch(`${BACKEND_URL}/notes/${encodeURIComponent(message.query)}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            
            if (response.ok) {
              // console.log('✅ BACKGROUND: DeleteNote successful');
              break; // Success, exit retry loop
            } else if (response.status === 401 && retryCount < maxRetries - 1) {
              // console.log(`⚠️  BACKGROUND: DeleteNote got 401, retry ${retryCount + 1}/${maxRetries}`);
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            } else {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          } catch (error) {
            if (retryCount < maxRetries - 1) {
              // console.log(`⚠️  BACKGROUND: DeleteNote error, retry ${retryCount + 1}/${maxRetries}:`, error.message);
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            } else {
              throw error;
            }
          }
        }
        
        if (!response || !response.ok) {
          throw new Error(`DeleteNote failed after ${maxRetries} retries`);
        }
        
        const data = await response.json();
        // console.log('✅ BACKGROUND: DeleteNote response received');
        sendResponse({ success: true, data });
      } catch (error) {
        console.error('❌ BACKGROUND: DeleteNote error:', error);
        sendResponse({ success: false, error: error.message });
      }
    }
    
    performDeleteNote();
    return true;
  }
  

  else if (message.action === "authCompleted") {
    // Notify all extension windows that auth has completed
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && tab.url.includes('chrome-extension://')) {
          chrome.tabs.sendMessage(tab.id, { action: "authStateChanged" }).catch(() => {
            // Ignore errors if extension popup is not active
          });
        }
      });
    });
    sendResponse({ success: true });
    return true;
  }

  else if (message.action === "clearAllCookies") {
    // Handle request to clear all auth cookies
    clearAllAuthCookies()
      .then(() => {
        sendResponse({ success: true, message: "All auth cookies cleared" });
      })
      .catch((error) => {
        console.error('Background cookie cleanup failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  else {
    null
  }

});

// Enhanced cookie monitoring for authentication across all domains
chrome.cookies.onChanged.addListener((changeInfo) => {
  // Monitor the correct backend domain instead of API_URL
  const backendDomain = new URL(BACKEND_URL).hostname;
  
  if (changeInfo.cookie.domain === backendDomain &&
      (changeInfo.cookie.name === 'access_token' || changeInfo.cookie.name === 'refresh_token')) {
    
    if (!changeInfo.removed) {
      // console.log(`🔑 BACKGROUND: Auth cookie detected on ${backendDomain}:`, changeInfo.cookie.name);
      // console.log('   ├─ Triggering auth check across extension');
      
      // Notify extension about potential auth completion
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.url && tab.url.includes('chrome-extension://')) {
            chrome.tabs.sendMessage(tab.id, { action: "checkAuthStatus" }).catch(() => {
              // Ignore errors if extension popup is not active
            });
          }
        });
      });
    } else {
      // console.log(`🚫 BACKGROUND: Auth cookie removed from ${backendDomain}:`, changeInfo.cookie.name);
      // console.log('   ├─ This may indicate logout or session expiration');
    }
  }
});