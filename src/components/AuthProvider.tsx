"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/clientApp";

// 1. Create the context
const AuthContext = createContext<{ user: User | null; loading: boolean }>({ 
  user: null, 
  loading: true 
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

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children} {/* Optional: prevents rendering until auth is checked */}
    </AuthContext.Provider>
  );
};

// 3. Export the hook you are using in your pages
export const useAuth = () => useContext(AuthContext);