import { createClient, type Session } from "@supabase/supabase-js";
import { config } from './config/environment';

const SUPABASE_URL = config.SUPABASE_URL as string;
const SUPABASE_KEY = config.SUPABASE_ANON_KEY as string;



console.log(SUPABASE_KEY , SUPABASE_URL);

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'hippocampus.auth'
  }
});

async function syncSessionToChromeStorage(session: Session | null) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      if (session?.access_token && session?.refresh_token) {
        await chrome.storage.local.set({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
      } else {
        await chrome.storage.local.remove(['access_token', 'refresh_token']);
      }
    }
  } catch {
    // noop for non-extension environments
  }
}

// Initialize: load any existing session and mirror to chrome.storage
(async () => {
  const { data } = await supabase.auth.getSession();
  await syncSessionToChromeStorage(data.session ?? null);
})();

// Keep chrome.storage in sync with Supabase session changes
supabase.auth.onAuthStateChange(async (_event, session) => {
  await syncSessionToChromeStorage(session);
});

export async function ensureSupabaseSessionFromStoredTokens(): Promise<void> {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
    const tokens = await chrome.storage.local.get(["access_token", "refresh_token"]);
    if (tokens.access_token && tokens.refresh_token) {
      await supabase.auth.setSession({
        access_token: tokens.access_token as string,
        refresh_token: tokens.refresh_token as string
      });
    }
  } catch {
    // ignore
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  // Ensure we have a session; refresh if close to expiry
  let { data } = await supabase.auth.getSession();
  let session = data.session;

  const now = Math.floor(Date.now() / 1000);
  const needsRefresh = session?.expires_at ? (session.expires_at - now) < 30 : false;

  if (!session) {
    await ensureSupabaseSessionFromStoredTokens();
    ({ data } = await supabase.auth.getSession());
    session = data.session;
  } else if (needsRefresh) {
    try {
      const { data: refreshed } = await supabase.auth.refreshSession();
      session = refreshed.session ?? session;
    } catch {
      // fall through; session may still be valid
    }
  }

  await syncSessionToChromeStorage(session ?? null);
  return session?.access_token ?? null;
}
