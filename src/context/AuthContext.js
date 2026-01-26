import React, { createContext, useState, useEffect, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { navigateTo } from '../utils/navigation';

export const AuthContext = createContext();

const SIGNUP_NAME_KEY = 'budgetai.signupName';

const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed. Firebase user:', firebaseUser ? firebaseUser.uid : 'null');
      
      if (firebaseUser) {
        try {
          console.log('Verifying user with backend...');
          // Verify with backend and get user data
          const preferredName =
            (firebaseUser.displayName && firebaseUser.displayName.trim())
              ? firebaseUser.displayName.trim()
              : (localStorage.getItem(SIGNUP_NAME_KEY) || '').trim();

          const response = await api.post('/auth/verify', preferredName ? { name: preferredName } : {});
          
          console.log('User verified:', response.data.user);
          const fallbackName = firebaseUser?.displayName;
          const normalizedUser = (response.data.user?.name === 'User' && fallbackName)
            ? { ...response.data.user, name: fallbackName }
            : response.data.user;
          setUser(normalizedUser);

          // If we still have a pending signup name, persist it to backend and clear it
          if (normalizedUser?.name && normalizedUser.name !== 'User') {
            localStorage.removeItem(SIGNUP_NAME_KEY);
          } else if (preferredName) {
            try {
              const setResp = await api.post('/auth/set-name', { name: preferredName });
              if (setResp?.data?.user) {
                setUser(setResp.data.user);
                localStorage.removeItem(SIGNUP_NAME_KEY);
              }
            } catch (e) {
              // ignore
            }
          }
          
          // Auto-navigate if we're on login/register pages and haven't navigated yet
          // Use a small delay to ensure navigate function is set
          setTimeout(() => {
            const currentPath = window.location.pathname;
            console.log('Current path:', currentPath, 'Has navigated:', hasNavigatedRef.current);
            
            if ((currentPath === '/login' || currentPath === '/register') && !hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              const targetPath = response.data.user.needsProfile ? '/complete-profile' : '/dashboard';
              console.log('Navigating from', currentPath, 'to', targetPath);
              
              navigateTo(targetPath);
            }
          }, 100);
        } catch (error) {
          console.error('Error verifying user:', error);
          console.error('Error details:', error.response?.data || error.message);
          console.error('Full error:', error);
          toast.error('Failed to verify user: ' + (error.response?.data?.message || error.message));
          setUser(null);
        }
      } else {
        console.log('No Firebase user, clearing user state');
        setUser(null);
        hasNavigatedRef.current = false;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Wait for onAuthStateChanged to fire and set user
      // It will handle navigation automatically
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name, email, password) => {
    try {
      // Keep a local copy so we can persist it even if Firebase token doesn't include name yet
      try {
        localStorage.setItem(SIGNUP_NAME_KEY, String(name || '').trim());
      } catch {
        // ignore
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      try {
        // Set Firebase displayName so backend /auth/verify gets the signup name
        await updateProfile(userCredential.user, { displayName: name });
        // Force refresh token so the "name" claim is available immediately
        await userCredential.user.getIdToken(true);

        // Immediately re-verify to persist the name on the backend user record
        const response = await api.post('/auth/verify', { name });
        if (response?.data?.user) {
          setUser(response.data.user);
          try {
            localStorage.removeItem(SIGNUP_NAME_KEY);
          } catch {
            // ignore
          }
        }
      } catch (updateError) {
        // Silently fail - display name update is not critical
        console.warn('Could not update display name:', updateError);
      }
      
      // Wait for onAuthStateChanged to fire and set user
      // It will handle navigation automatically
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      let errorMessage = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
