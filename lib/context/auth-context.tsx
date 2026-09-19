'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSupabaseAuthClient } from '@/lib/supabase/auth-client';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  workspaceName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  accessToken: string | null;
  loading: boolean;
  workspaceName: string;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithPassword: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error?: string; requiresEmailConfirmation?: boolean }>;
  signInWithDemo: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateWorkspace: (name: string) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  getAccessToken: () => Promise<string | null>;
}

const WORKSPACE_KEY = 'vectorhire_workspace_name';

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  accessToken: null,
  loading: true,
  workspaceName: 'Enterprise Recruiting',
  signInWithPassword: async () => ({}),
  signUpWithPassword: async () => ({}),
  signInWithDemo: async () => ({}),
  signOut: async () => {},
  updateWorkspace: () => {},
  updateUser: () => {},
  getAccessToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceName, setWorkspaceName] = useState('Enterprise Recruiting');
  const router = useRouter();

  const syncUserFromSession = useCallback((activeSession: Session | null) => {
    setSession(activeSession);
    if (activeSession?.user) {
      const meta = activeSession.user.user_metadata || {};
      const fullName =
        meta.full_name ||
        meta.name ||
        (activeSession.user.email ? activeSession.user.email.split('@')[0] : 'Recruiter');
      const role = meta.role || 'Talent Acquisition';

      setUser({
        id: activeSession.user.id,
        email: activeSession.user.email || '',
        name: fullName,
        role: role,
        avatarUrl: meta.avatar_url,
      });
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Load saved workspace name
    if (typeof window !== 'undefined') {
      try {
        const savedWorkspace = localStorage.getItem(WORKSPACE_KEY);
        if (savedWorkspace) {
          setWorkspaceName(savedWorkspace);
        }
      } catch {
        // Ignore localStorage access restrictions
      }
    }

    const supabase = getSupabaseAuthClient();

    if (!supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Initial session check
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession }, error }) => {
        if (!isMounted) return;
        if (error) {
          syncUserFromSession(null);
        } else {
          syncUserFromSession(initialSession);
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          syncUserFromSession(null);
          setLoading(false);
        }
      });

    // 2. Real-time auth state subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      syncUserFromSession(currentSession);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [syncUserFromSession]);

  const signInWithPassword = async (email: string, password: string): Promise<{ error?: string }> => {
    const supabase = getSupabaseAuthClient();
    if (!supabase) {
      return { error: 'Authentication service is not configured. Please check Supabase connection.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        syncUserFromSession(data.session);
      }

      return {};
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'An unexpected error occurred during sign in.',
      };
    }
  };

  const signUpWithPassword = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ error?: string; requiresEmailConfirmation?: boolean }> => {
    const supabase = getSupabaseAuthClient();
    if (!supabase) {
      return { error: 'Authentication service is not configured.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            role: 'Talent Acquisition',
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // Check if email confirmation is required by Supabase
      if (data.user && !data.session) {
        return { requiresEmailConfirmation: true };
      }

      if (data.session) {
        syncUserFromSession(data.session);
      }

      return {};
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'An unexpected error occurred during sign up.',
      };
    }
  };

  const signInWithDemo = async (): Promise<{ error?: string }> => {
    const supabase = getSupabaseAuthClient();
    if (!supabase) {
      return { error: 'Supabase client is not available.' };
    }

    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok || !data.ok || !data.session) {
        return { error: data.error || 'Demo login failed.' };
      }

      // Set the returned session on the browser client
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (setSessionError) {
        return { error: setSessionError.message };
      }

      const {
        data: { session: updatedSession },
      } = await supabase.auth.getSession();
      syncUserFromSession(updatedSession);
      return {};
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Demo authentication failed.',
      };
    }
  };

  const signOut = async () => {
    const supabase = getSupabaseAuthClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Continue clearing state even if remote call fails
      }
    }
    syncUserFromSession(null);
    router.push('/login');
  };

  const updateWorkspace = (name: string) => {
    setWorkspaceName(name);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(WORKSPACE_KEY, name);
      } catch {
        // Ignore
      }
    }
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (session?.access_token) {
      return session.access_token;
    }
    const supabase = getSupabaseAuthClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        accessToken: session?.access_token || null,
        loading,
        workspaceName,
        signInWithPassword,
        signUpWithPassword,
        signInWithDemo,
        signOut,
        updateWorkspace,
        updateUser,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
