"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase/clientApp";

// 1. Create the context
const AuthContext = createContext<{ user: User | null; loading: boolean; signOut: () => Promise<void> }>({ 
  user: null, 
  loading: true,
  signOut: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2. Listen to Firebase Auth state changes globally
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Broadcast token to the extension so it automatically logs in
  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    const broadcastToken = async () => {
      try {
        const token = await user.getIdToken();
        if (isMounted) {
          window.postMessage({ type: 'SCAMSHIELD_AUTH', token }, '*');
        }
      } catch (e) {
        console.error("Failed to broadcast token", e);
      }
    };

    broadcastToken();
    // Send it a few times in case the extension content script loads slowly
    const intervalId = setInterval(broadcastToken, 3000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user]);

  const signOut = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {!loading && children} {/* Optional: prevents rendering until auth is checked */}
    </AuthContext.Provider>
  );
};

// 3. Export the hook you are using in your pages
export const useAuth = () => useContext(AuthContext);