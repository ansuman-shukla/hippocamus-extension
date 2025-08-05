# To-do List for Refactoring Authentication Flow

## Frontend Tasks

- **Update `manifest.json`:**
  - [ ] Add `chrome.identity` to permissions for handling authentication.
  - [ ] Ensure `storage` permission is present to store tokens securely.
  - [ ] Verify host permissions cover necessary URLs for auth flow.

- **Implement New Auth Flow in `useAuth.ts`:**
  - [ ] Use `chrome.identity.getRedirectURL()` to set up redirect URL.
  - [ ] Implement `chrome.identity.launchWebAuthFlow` to initiate auth.
  - [ ] Parse tokens from the redirect URL and store them in `chrome.storage.local`.
  - [ ] Implement automatic token refresh logic using the stored `refreshToken`.

- **Modify `IntroPage.tsx`:**
  - [ ] Replace existing popup window auth logic with new flow.
  - [ ] Display "Get Started" UI if tokens are missing or expired.
  - [ ] Ensure 'Get Started' button triggers the new auth flow.
  
- **Enhance `background.js`:**
  - [ ] Add listeners for auth status messages from content scripts.
  - [ ] Implement logic to handle and distribute authentication status updates.

- **Adjust `authUtils.ts`:**
  - [ ] Remove old functions related to popup-based auth.
  - [ ] Implement functions for secure storage and retrieval of tokens.

## Backend Tasks

- **Simplify `authentication.py`:**
  - [ ] Remove all logic for token refreshing and session management.
  - [ ] Ensure only token verification remains to protect endpoints.

- **Clean up `auth_router.py`:**
  - [ ] Delete endpoints related to user logout and token refresh.
  - [ ] Keep authentication status checks and token verification.

- **General Backend Adjustments:**
  - [ ] Confirm CORS settings allow requests from the extension.
  - [ ] Verify all protected routes use the middleware for token verification.

