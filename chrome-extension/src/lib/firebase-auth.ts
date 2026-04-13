// ============================================================
// ScamShield AI — Extension Firebase Auth Helper
// Handles sign-in flow and token persistence in chrome.storage
// ============================================================

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: '__FIREBASE_API_KEY__',
  authDomain: '__FIREBASE_AUTH_DOMAIN__',
  projectId: '__FIREBASE_PROJECT_ID__',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Sign in using Google via chrome.identity API.
 * This uses Chrome's built-in OAuth flow — smooth UX, no popup windows.
 */
export async function signInWithGoogle(): Promise<User> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, async (chromeToken) => {
      if (chrome.runtime.lastError || !chromeToken) {
        reject(new Error(chrome.runtime.lastError?.message ?? 'Failed to get auth token'));
        return;
      }

      try {
        const credential = GoogleAuthProvider.credential(null, chromeToken);
        const userCredential = await signInWithCredential(auth, credential);
        const idToken = await userCredential.user.getIdToken();

        // Persist the Firebase ID token for background.ts / api-client.ts
        await chrome.storage.local.set({ firebaseToken: idToken });

        resolve(userCredential.user);
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Sign out and clear stored token.
 */
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
  await chrome.storage.local.remove(['firebaseToken']);
}

/**
 * Listen for auth state changes and keep token in sync.
 */
export function onAuthChanged(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const idToken = await user.getIdToken();
      await chrome.storage.local.set({ firebaseToken: idToken });
    }
    callback(user);
  });
}

/**
 * Get the currently signed-in user (or null).
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export { auth };
