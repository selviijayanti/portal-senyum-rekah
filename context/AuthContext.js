"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

const AuthContext = createContext({
  user: null,
  userProfile: null,
  loading: true,
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  refreshUserProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper untuk membaca dokumen user dari Firestore
  const fetchUserProfile = async (currentUser) => {
    if (!currentUser) {
      setUserProfile(null);
      return null;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const profileData = userSnap.data();
        setUserProfile(profileData);
        return profileData;
      } else {
        // Jika dokumen belum ada (misal Google sign in pertama kali)
        const defaultProfile = {
          nama: currentUser.displayName || currentUser.email?.split("@")[0] || "Pengguna",
          email: currentUser.email || "",
          noHp: "",
          role: "pasien", // Peran awal sesuai PRD 2.2
          aktif: true,
          dibuatPada: serverTimestamp(),
        };
        await setDoc(userRef, defaultProfile);
        setUserProfile(defaultProfile);
        return defaultProfile;
      }
    } catch (err) {
      console.error("Gagal memuat profil pengguna:", err);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      await fetchUserProfile(auth.currentUser);
    }
  };

  const loginWithEmail = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchUserProfile(cred.user);
    return { user: cred.user, profile };
  };

  const registerWithEmail = async (nama, email, password, noHp) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update auth display name
    try {
      await updateProfile(cred.user, { displayName: nama });
    } catch (e) {
      console.warn("Update profile nama:", e);
    }

    // Buat dokumen users/{uid} baru sesuai PRD 7.1
    const userRef = doc(db, "users", cred.user.uid);
    const newProfile = {
      nama: nama.trim(),
      email: cred.user.email,
      noHp: noHp?.trim() || "",
      role: "pasien", // Peran awal
      aktif: true,
      dibuatPada: serverTimestamp(),
    };

    await setDoc(userRef, newProfile);
    setUserProfile(newProfile);
    return { user: cred.user, profile: newProfile };
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const profile = await fetchUserProfile(cred.user);
    return { user: cred.user, profile };
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
