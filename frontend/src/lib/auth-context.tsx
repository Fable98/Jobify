'use client';

import React, { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  refetchUser: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<{ user: User }>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const res = await apiClient<{ user: User }>('/api/v1/auth/me');
        return res.data;
      } catch {
        return { user: null as unknown as User };
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const logout = async () => {
    try {
      await apiClient('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      queryClient.setQueryData(['auth', 'me'], { user: null });
      queryClient.clear();
      window.location.href = '/login';
    }
  };

  const refetchUser = async () => {
    await refetch();
  };

  return (
    <AuthContext.Provider
      value={{
        user: data?.user || null,
        isLoading,
        refetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
