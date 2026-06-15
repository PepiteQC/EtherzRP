/**
 * src/context/AuthProvider.tsx
 * 
 * Fournisseur Global d'Authentification pour EtherWorld RP.
 * Fait la passerelle entre React, Firebase Auth (FirebaseAuthClient) et Zustand (FirebaseCache).
 * Conformément à la Règle d'Or et à la TODO "propre production" :
 * - Charge les profils et initialise Zustand au login
 * - Orchestre les WebSockets Live sans solliciter Firestore
 * - Fournit un contexte réactif sans re-rendus inutiles
 */

import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import AuthContext, { type AuthUser, type AuthContextValue } from './AuthContext';
import { FirebaseAuthClient } from '../lib/firebase/firebaseClient';
import { onAuthChange, isAdmin as checkIsAdmin } from '../lib/firebase/config';
import { useFirebaseCacheStore } from '../store/firebaseStoreCache';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdminState, setIsAdminState] = useState<boolean>(false);

  const initCache  = useFirebaseCacheStore(s => s.initCache);
  const clearCache = useFirebaseCacheStore(s => s.clearCache);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Validation des droits d'administration Firebase Admin
        const adminFlag = await checkIsAdmin(firebaseUser);
        
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'Citoyen',
          role: adminFlag ? 'admin' : 'player',
        };
        
        setUser(authUser);
        setIsAdminState(adminFlag);

        // Déclencher le chargement propre du cache Zustand (Profil + Inventaire) Step 6
        await initCache(firebaseUser.uid);
      } else {
        setUser(null);
        setIsAdminState(false);
        clearCache();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [initCache, clearCache]);

  const handleLogin = useCallback(async (...args: unknown[]) => {
    if (args.length < 2) return;
    const email = typeof args[0] === 'string' ? args[0] : '';
    const password = typeof args[1] === 'string' ? args[1] : '';
    if (!email || !password) return;
    
    await FirebaseAuthClient.login(email, password);
  }, []);

  const handleLogout = useCallback(async () => {
    await FirebaseAuthClient.logout();
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    isAdmin: isAdminState,
    login: handleLogin,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
