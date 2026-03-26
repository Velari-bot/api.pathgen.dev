"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface AuthState {
  user: User | null;
  loading: boolean;
  userData: any | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    userData: null,
  });

  useEffect(() => {
    if (!auth) {
      setState({ user: null, loading: false, userData: null });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && db) {
        // Fetch user data from Firestore (credits, etc)
        const userRef = doc(db, "users", user.uid);
        
        // Listen to changes in real-time
        const unsubDoc = onSnapshot(userRef, (snapshot) => {
          setState({
            user,
            loading: false,
            userData: snapshot.exists() ? snapshot.data() : null,
          });
        });

        return () => unsubDoc();
      } else {
        setState({ user: null, loading: false, userData: null });
      }
    });

    return () => unsubscribe();
  }, []);

  return state;
}
