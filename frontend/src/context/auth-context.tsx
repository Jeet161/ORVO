'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, User } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: (idToken: string) => Promise<void>;
  register: (email: string, name: string, password: string, otpCode?: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isSeller: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  loginGoogle: async () => {},
  register: async () => {},
  logout: () => {},
  isAdmin: false,
  isSeller: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('orvo_token');
    if (token) {
      authApi.me()
        .then((res: any) => setUser(res.user))
        .catch(() => localStorage.removeItem('orvo_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('orvo_token', res.accessToken);
    setUser(res.user);
    // Redirect based on role
    if (res.user.role === 'ADMIN') router.push('/admin/dashboard');
    else if (res.user.role === 'SELLER') router.push('/seller/dashboard');
    else router.push('/');
  };

  const loginGoogle = async (idToken: string) => {
    const res = await authApi.loginGoogle(idToken);
    localStorage.setItem('orvo_token', res.accessToken);
    setUser(res.user);
    if (res.user.role === 'ADMIN') router.push('/admin/dashboard');
    else if (res.user.role === 'SELLER') router.push('/seller/dashboard');
    else router.push('/');
  };

  const register = async (email: string, name: string, password: string, otpCode?: string) => {
    await authApi.register(email, name, password, otpCode);
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('orvo_token');
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      loginGoogle,
      register,
      logout,
      isAdmin: user?.role === 'ADMIN',
      isSeller: user?.role === 'SELLER',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
