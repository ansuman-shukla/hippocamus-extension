import { HashRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import SearchPage from "./page/SearchPage";
import Intro from "./page/IntroPage";
import SearchResponse from "./page/SearchResultPage";
import ResponsePage from "./page/ResponsePage";
import './index.css';



const pageVariants = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};

import { ReactNode, useEffect, useState } from "react";
import { useSimpleAuth } from "./components/SimpleAuth";
import AuthLoadingIndicator from "./components/AuthLoadingIndicator";
import { getQuotes } from "./utils/apiClient";

// Extend Window interface to include our custom property
declare global {
  interface Window {
    authTransferInProgress?: boolean;
  }
}

const PageWrapper = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
    className="p-0 bg-transparent min-w-[100%]"
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const Navigate = useNavigate();
  const location = useLocation();
  const [quotes, setQuotes] = useState<string[]>([]);
const { loading: isLoading, isAuthenticated } = useSimpleAuth();

  // Keyboard shortcut handler for Alt+X (when extension is already open)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Alt+X combination
      if (event.altKey && event.key.toLowerCase() === 'x') {
        event.preventDefault(); // Prevent default browser action for Alt+X
        console.log('🔍 APP: Alt+X shortcut triggered, navigating to search page');
        
        // Navigate to search page (extension is already open)
        Navigate("/search");
      }
    };

    // Message listener for focus requests from content script
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === "focusSearch") {
        console.log('🔍 APP: Focus search message received from content script');
        Navigate("/search");
      }
      
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('message', handleMessage);

    // Cleanup function to remove event listeners
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('message', handleMessage);
    };
  }, [Navigate]);


  // Simplified auth checking - let useAuth hook handle everything
  // The useAuth hook already implements the proper OAuth flow from OauthImplementation.md

  

  useEffect(() => {
    const handleAuthFlow = async () => {

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.url) return;



      try {
        // Check if user is authenticated via backend cookies and validate them
        const cookie = await chrome.cookies.get({
          url: import.meta.env.VITE_BACKEND_URL,
          name: 'access_token',
        });

        if (cookie && location.pathname === "/") {
          console.log('🔍 APP: Backend cookies found in handleAuthFlow - useAuth will handle validation');
          // Let useAuth hook handle validation to avoid duplicate calls
        }

        // Load quotes from localStorage or fetch from backend
        if(localStorage.getItem("quotes")){
          console.log("found Quotes")
          setQuotes(JSON.parse(localStorage.getItem("quotes") || "[]"));
          console.log("have set the quotes")
        }else{
          const fetchQuotes = async (retryCount = 0) => {
            try {
              const quotesData = await getQuotes();
              if (quotesData && Array.isArray(quotesData)) {
                const filteredQuotes = quotesData.filter((quote: string) => quote.length > 0);
                setQuotes(prev => [
                  ...new Set([...prev, ...filteredQuotes])
                ]);
                console.log("GOT QUOTES FROM BACKEND")
                localStorage.setItem("quotes", JSON.stringify(filteredQuotes));
                console.log("Quotes are set")
              } else {
                console.error("Response data is not an array:", quotesData);
              }
            } catch (error: any) {
              console.error("Failed to get quotes:", error?.message || "No response");
              // Retry up to 2 times with increasing delay for new users
              if (retryCount < 2) {
                console.log(`Retrying quotes fetch in ${(retryCount + 1) * 1000}ms...`);
                setTimeout(() => fetchQuotes(retryCount + 1), (retryCount + 1) * 1000);
              }
            }
          };
          
          fetchQuotes();
        }
      } catch (error) {
        console.error("Error handling auth flow:", error);
      }


      
      
    };

    handleAuthFlow();

    // Enhanced cookie change monitoring for session management
    const handleCookieChange = (changeInfo: chrome.cookies.CookieChangeInfo) => {
      if (changeInfo.cookie.name === "access_token" && 
          changeInfo.cookie.domain.includes(new URL(import.meta.env.VITE_BACKEND_URL).hostname)) {
        
        if (changeInfo.removed) {
          console.log('🚫 APP: Backend access token was removed, checking if we need to redirect to auth');
          
          // Check if we're on a protected page and should redirect to intro/auth
          if (location.pathname === "/submit" || location.pathname === "/search" || location.pathname === "/response") {
            console.log('🔄 APP: User was on protected page, redirecting to intro for re-authentication');
            Navigate("/");
          }
        } else {
          console.log('🔑 APP: Backend access token detected, user may have authenticated');
          // Token was added, but don't auto-navigate - let existing auth flow handle it
        }
      }
    };

    // Listen for background script auth failure notifications
    const handleBackgroundMessage = (message: any, _sender: any, sendResponse: any) => {
      if (message.action === "authenticationFailed") {
        console.log('🚫 APP: Received authentication failure notification from background script');
        console.log('🔄 APP: Redirecting to intro page for re-authentication');
        Navigate("/");
        sendResponse({ received: true });
      }
    };

    chrome.cookies.onChanged.addListener(handleCookieChange);
    chrome.runtime.onMessage.addListener(handleBackgroundMessage);
    
    return () => {
      chrome.cookies.onChanged.removeListener(handleCookieChange);
      chrome.runtime.onMessage.removeListener(handleBackgroundMessage);
    };
  }, []);

  // Navigation effect based on auth state
  useEffect(() => {
    if (!isLoading && isAuthenticated && location.pathname === "/") {
      console.log('🎯 APP: User is authenticated, redirecting to submit page');
      Navigate("/submit");
    }
  }, [isLoading, isAuthenticated, location.pathname, Navigate]);

  // Show loading screen immediately when auth is being checked
  if (isLoading) {
    return (
      <AuthLoadingIndicator 
        message="Hold on" 
        showDetails={true}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Intro /></PageWrapper>} />
        <Route path="/submit" element={<PageWrapper><ResponsePage /></PageWrapper>} />
        <Route path="/search" element={<PageWrapper><SearchPage Quote={quotes[Math.floor(Math.random() * quotes.length)]} /></PageWrapper>} />
        <Route path="/response" element={<PageWrapper><SearchResponse /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  // Detect if we're running in popup mode
  const isPopup = window.location.search.includes('popup=true') || 
                  window.innerWidth <= 420 && window.innerHeight <= 600;

  return (
    <Router>
      <div className={`flex items-center justify-center bg-transparent ${
        isPopup ? 'min-h-[500px] w-[419px]' : ''
      }`}>
        <AnimatedRoutes />
      </div>
    </Router>
  );
};

export default App;