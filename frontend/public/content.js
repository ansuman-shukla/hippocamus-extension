// STEP 0: Handle multiple script execution
console.log('🔄 CONTENT STEP 0: Content script execution started');
console.log(`   ├─ Execution time: ${new Date().toISOString()}`);
console.log(`   ├─ Current URL: ${window.location.href}`);
console.log(`   ├─ Document ready state: ${document.readyState}`);

if (window.hippoCampusContentScriptLoaded) {
  console.log("♻️ CONTENT STEP 0: HippoCampus content script already loaded, executing toggle only");
  console.log("   ├─ This is a re-execution of the content script (not first load)");
  
  // Simple toggle logic - always check DOM first, ignore state inconsistencies
  const existingSidebar = document.getElementById("my-extension-sidebar");
  console.log('🔍 CONTENT STEP 0: Simple toggle - checking DOM for existing sidebar');
  console.log(`   ├─ existingSidebar found: ${!!existingSidebar}`);
  
  if (existingSidebar) {
    // Sidebar exists in DOM - close it
    console.log("📴 CONTENT STEP 0: Sidebar exists - closing it");
    if (window.hippoCampusCloseSidebar) {
      console.log("   ├─ Using global hippoCampusCloseSidebar function");
      window.hippoCampusCloseSidebar(existingSidebar);
    } else {
      console.log("⚠️ CONTENT STEP 0: Global close function not available, using fallback");
      existingSidebar.style.animation = "slideOut 0.3s ease-in-out forwards";
      setTimeout(() => {
        if (existingSidebar.parentNode) {
          existingSidebar.remove();
        }
        document.removeEventListener("click", window.hippoCampusHandleClickOutside);
      }, 300);
    }
  } else {
    // No sidebar in DOM - create it
    console.log("📱 CONTENT STEP 0: No sidebar exists - creating new one");
    if (window.hippoCampusCreateSidebar) {
      console.log("   ├─ Using global hippoCampusCreateSidebar function");
      window.hippoCampusCreateSidebar();
    } else {
      console.log("⚠️ CONTENT STEP 0: Global create function not available");
    }
  }
} else {
  console.log("🆕 CONTENT STEP 0: First-time content script execution");
  window.hippoCampusContentScriptLoaded = true;
  console.log("   ├─ Set hippoCampusContentScriptLoaded flag to prevent re-initialization");

if (window.location.protocol === "chrome:") {
  window.location.href = chrome.runtime.getURL("error.html");
}

// Flag to prevent duplicate summary generation requests
let isGeneratingSummary = false;

// Global state tracking
let extensionState = window.hippoCampusExtensionState || {
  isOpen: false,
  isInitializing: false
};

// Make state globally available
window.hippoCampusExtensionState = extensionState;

// Sync state with DOM on script load
const existingSidebarOnLoad = document.getElementById("my-extension-sidebar");
if (existingSidebarOnLoad && !extensionState.isOpen) {
  console.log("Found existing sidebar, syncing state");
  extensionState.isOpen = true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "closeExtension" && message.target === "content") {
    const sidebar = document.getElementById("my-extension-sidebar");
    if (sidebar) {
      sidebar.style.animation = "slideOut 0.3s ease-in-out forwards";
      setTimeout(() => {
        sidebar.remove();
        // Clean up click listener
        document.removeEventListener("click", window.hippoCampusHandleClickOutside || handleClickOutside);
      }, 300);
    }
    sendResponse({success: true});
  }
  
  if (message.action === "focusSearch") {
    // Alt+X handler: ensure extension is open and focus on search
    let sidebar = document.getElementById("my-extension-sidebar");
    
    if (!sidebar || !extensionState.isOpen) {
      // If sidebar doesn't exist, create it first
      sidebar = createSidebar();
      if (!sidebar) {
        console.log("Failed to create sidebar for focus search");
        sendResponse({success: false, error: "Failed to create sidebar"});
        return;
      }
    }
    
    // Send message to iframe to focus on search input
    if (sidebar) {
      const iframe = sidebar.querySelector('iframe');
      if (iframe) {
        // Wait for iframe to load before sending message
        setTimeout(() => {
          try {
            iframe.contentWindow.postMessage({ action: "focusSearch" }, "*");
            console.log("Focus search message sent to iframe");
          } catch (error) {
            console.error("Failed to send focus message to iframe:", error);
          }
        }, 200); // Increased delay to ensure iframe is loaded
      }
    }
    
    sendResponse({success: true});
  }
  if (message.action === "extractPageContent") {
    // Prevent duplicate summary generation
    if (isGeneratingSummary) {
      console.log("Summary generation already in progress, ignoring duplicate request");
      sendResponse({ error: "Summary generation already in progress" });
      return;
    }
    
    isGeneratingSummary = true;
    
    const elements = Array.from(document.querySelectorAll('div, p, a'));
    const seen = new Set();
    let lines = elements
      .filter(el => !el.querySelector('div, p, a'))
      .filter(el => {
        const style = window.getComputedStyle(el);
        return (
          el.offsetParent !== null &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      })
      .map(el => el.textContent?.replace(/\s+/g, ' ').trim() || '')
      .filter(text => text.length > 2 && !seen.has(text) && seen.add(text)); 

    let content = lines.join('\n').replace(/\n{2,}/g, '\n');
    
    // Send message to extension frontend to handle API call
    const sidebar = document.getElementById("my-extension-sidebar");
    if (sidebar) {
      const iframe = sidebar.querySelector('iframe');
      if (iframe) {
        // Create a promise to handle the response
        const messageId = Date.now() + Math.random();
        const responseHandler = (event) => {
          if (event.data && event.data.messageId === messageId) {
            window.removeEventListener('message', responseHandler);
            isGeneratingSummary = false;
            
            if (event.data.success) {
              console.log("Content summarized successfully");
              console.log("Summary:", event.data.data);
              sendResponse({ content: event.data.data });
            } else {
              const errorMessage = event.data.error || "Failed to generate summary";
              
              // Handle rate limit error specifically
              if (errorMessage === 'RATE_LIMIT_EXCEEDED') {
                console.log("🚫 CONTENT: Rate limit exceeded for summary generation");
                console.log("   ├─ This is a legitimate daily limit reached");
                sendResponse({ 
                  error: 'RATE_LIMIT_EXCEEDED'
                });
              } else {
                console.error("❌ CONTENT: Failed to generate summary:", errorMessage);
                sendResponse({ error: errorMessage });
              }
            }
          }
        };
        
        window.addEventListener('message', responseHandler);
        
        // Send message to iframe
        iframe.contentWindow.postMessage({ 
          action: "generateSummary", 
          content: content,
          messageId: messageId
        }, "*");
      } else {
        isGeneratingSummary = false;
        sendResponse({ error: "Extension iframe not found" });
      }
    } else {
      isGeneratingSummary = false;
      sendResponse({ error: "Extension not open" });
    }
    return true;
  }
});
  

// Global click handler for closing sidebar when clicking outside
const handleClickOutside = (event) => {
  const sidebar = document.getElementById("my-extension-sidebar");
  if (sidebar && !sidebar.contains(event.target)) {
    closeSidebar(sidebar);
  }
};

// Make globally available
window.hippoCampusHandleClickOutside = handleClickOutside;

// STEP 5A: Function to close sidebar with animation
const closeSidebar = (sidebarElement) => {
  console.log('🔻 CONTENT STEP 5A: closeSidebar function called');
  console.log(`   ├─ Sidebar element provided: ${!!sidebarElement}`);
  
  if (sidebarElement) {
    console.log('✅ CONTENT STEP 5A: Valid sidebar element found, proceeding with closure');
    console.log(`   ├─ Sidebar element ID: ${sidebarElement.id}`);
    console.log(`   ├─ Sidebar current display: ${window.getComputedStyle(sidebarElement).display}`);
    console.log(`   ├─ Sidebar current visibility: ${window.getComputedStyle(sidebarElement).visibility}`);
    
    console.log('📊 CONTENT STEP 5A: Updating extension state to closed');
    extensionState.isOpen = false;
    console.log(`   ├─ extensionState.isOpen set to: ${extensionState.isOpen}`);
    
    console.log('🎬 CONTENT STEP 5A: Applying slideOut animation');
    sidebarElement.style.animation = "slideOut 0.3s ease-in-out forwards";
    console.log('   ├─ Animation applied: slideOut 0.3s ease-in-out forwards');
    
    console.log('⏱️ CONTENT STEP 5A: Setting up cleanup timeout (300ms)');
    setTimeout(() => {
      console.log('🧹 CONTENT STEP 5A: Cleanup timeout executing');
      
      if (sidebarElement.parentNode) {
        console.log('✅ CONTENT STEP 5A: Removing sidebar from DOM');
        console.log(`   ├─ Parent node: ${sidebarElement.parentNode.tagName}`);
        sidebarElement.remove();
        console.log('   ├─ Sidebar element removed successfully');
      } else {
        console.log('⚠️ CONTENT STEP 5A: Sidebar already removed from DOM');
      }
      
      // Remove click listener when sidebar is closed
      console.log('🔇 CONTENT STEP 5A: Removing click outside listener');
      document.removeEventListener("click", window.hippoCampusHandleClickOutside || handleClickOutside);
      console.log('   ├─ Click outside listener removed');
      
      console.log('🏁 CONTENT STEP 5A: Resetting initialization state');
      extensionState.isInitializing = false;
      console.log(`   ├─ extensionState.isInitializing set to: ${extensionState.isInitializing}`);
      
      console.log('✅ CONTENT STEP 5A: Sidebar closure completed successfully');
    }, 300);
  } else {
    console.log('❌ CONTENT STEP 5A: No sidebar element provided, cannot close');
  }
};

// Make function globally available
window.hippoCampusCloseSidebar = closeSidebar;

// STEP 5B: Function to create sidebar
const createSidebar = () => {
  console.log('🔺 CONTENT STEP 5B: createSidebar function called');
  console.log(`   ├─ Function call time: ${new Date().toISOString()}`);
  console.log(`   ├─ Current URL: ${window.location.href}`);
  
  // Prevent multiple sidebar creation
  console.log('🚧 CONTENT STEP 5B: Checking for concurrent initialization');
  if (extensionState.isInitializing) {
    console.log("⚠️ CONTENT STEP 5B: Sidebar creation already in progress, ignoring");
    console.log("   ├─ This prevents multiple sidebars from being created simultaneously");
    return null;
  }
  
  // Check if sidebar already exists
  console.log('🔍 CONTENT STEP 5B: Checking for existing sidebar in DOM');
  const existingSidebar = document.getElementById("my-extension-sidebar");
  if (existingSidebar) {
    console.log("⚠️ CONTENT STEP 5B: Sidebar already exists, not creating new one");
    console.log(`   ├─ Existing sidebar ID: ${existingSidebar.id}`);
    console.log(`   ├─ Existing sidebar display: ${window.getComputedStyle(existingSidebar).display}`);
    return existingSidebar;
  }
  
  console.log("🚀 CONTENT STEP 5B: Creating new sidebar");
  console.log('🔒 CONTENT STEP 5B: Setting initialization lock');
  extensionState.isInitializing = true;
  console.log(`   ├─ extensionState.isInitializing set to: ${extensionState.isInitializing}`);
  
  console.log('🏗️ CONTENT STEP 5B: Creating sidebar container element');
  const sidebar = document.createElement("div");
  sidebar.id = "my-extension-sidebar";
  console.log(`   ├─ Sidebar element created with ID: ${sidebar.id}`);
  
  console.log('🎬 CONTENT STEP 5B: Applying slideIn animation');
  sidebar.style.animation = "slideIn 0.3s ease-in-out forwards";
  console.log('   ├─ Animation applied: slideIn 0.3s ease-in-out forwards');

  console.log('🖼️ CONTENT STEP 5B: Creating iframe element');
  const iframe = document.createElement("iframe");
  const iframeSrc = chrome.runtime.getURL("index.html");
  iframe.src = iframeSrc;
  console.log(`   ├─ Iframe source URL: ${iframeSrc}`);
  
  console.log('📏 CONTENT STEP 5B: Setting iframe styles');
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  console.log('   ├─ Iframe styles applied (width: 100%, height: 100%, border: none)');
  
  console.log('🔗 CONTENT STEP 5B: Appending iframe to sidebar');
  sidebar.appendChild(iframe);
  console.log('   ├─ Iframe successfully appended to sidebar');
  
  console.log('📍 CONTENT STEP 5B: Appending sidebar to document body');
  document.body.appendChild(sidebar);
  console.log('   ├─ Sidebar successfully appended to document body');

  // Update state
  console.log('📊 CONTENT STEP 5B: Updating extension state');
  extensionState.isOpen = true;
  extensionState.isInitializing = false;
  console.log(`   ├─ extensionState.isOpen set to: ${extensionState.isOpen}`);
  console.log(`   ├─ extensionState.isInitializing set to: ${extensionState.isInitializing}`);

  // Add click outside listener with small delay to avoid immediate closing
  console.log('👂 CONTENT STEP 5B: Setting up click outside listener (100ms delay)');
  setTimeout(() => {
    console.log('🎧 CONTENT STEP 5B: Adding click outside event listener');
    document.addEventListener("click", window.hippoCampusHandleClickOutside || handleClickOutside);
    console.log('   ├─ Click outside listener added successfully');
  }, 100);
  
  console.log('✅ CONTENT STEP 5B: Sidebar creation completed successfully');
  console.log(`   ├─ Sidebar element: ${sidebar.tagName}#${sidebar.id}`);
  console.log(`   ├─ Sidebar in DOM: ${document.body.contains(sidebar)}`);
  
  return sidebar;
};

// Make function globally available
window.hippoCampusCreateSidebar = createSidebar;

// STEP 4: Main toggle function (called when Alt+M is pressed)
(() => {
  console.log('🚀 CONTENT STEP 4: Main toggle function executing');
  console.log(`   ├─ Script execution time: ${new Date().toISOString()}`);
  console.log(`   ├─ Current URL: ${window.location.href}`);
  console.log(`   ├─ Document ready state: ${document.readyState}`);
  
  // Simple DOM-based toggle - ignore state inconsistencies
  const existingSidebar = document.getElementById("my-extension-sidebar");
  console.log('🔍 CONTENT STEP 4: Simple toggle - checking DOM for existing sidebar');
  console.log(`   ├─ Existing sidebar found: ${!!existingSidebar}`);
  
  if (existingSidebar) {
    // Sidebar exists in DOM - close it
    console.log('📴 CONTENT STEP 4: Sidebar exists - closing it');
    console.log('   ├─ Calling closeSidebar function');
    closeSidebar(existingSidebar);
  } else {
    // No sidebar in DOM - create it
    console.log('📱 CONTENT STEP 4: No sidebar exists - creating new one');
    console.log('   ├─ Calling createSidebar function');
    createSidebar();
  }
})();

} // Close the else block for script loading check