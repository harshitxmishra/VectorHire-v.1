'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseAuthClient } from '@/lib/supabase/auth-client';
import { useRouter } from 'next/navigation';

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
  loading: boolean;
  workspaceName: string;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithPassword: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signInWithDemo: (role?: string, name?: string) => void;
  signOut: () => Promise<void>;
  updateWorkspace: (name: string) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const DEMO_USER_KEY = 'vectorhire_demo_user';
const WORKSPACE_KEY = 'vectorhire_workspace_name';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  workspaceName: 'Enterprise Recruiting',
  signInWithPassword: async () => ({}),
  signUpWithPassword: async () => ({}),
  signInWithDemo: () => {},
  signOut: async () => {},
  updateWorkspace: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceName, setWorkspaceName] = useState('Enterprise Recruiting');
  const router = useRouter();

  useEffect(() => {
    // Load saved workspace name
    if (typeof window !== 'undefined') {
      const savedWorkspace = localStorage.getItem(WORKSPACE_KEY);
      if (savedWorkspace) {
        setWorkspaceName(savedWorkspace);
      }
    }

    const supabase = getSupabaseAuthClient();

    if (supabase) {
      // Check active Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          setUser({
            id: session.user.id,
            email: session.user.email || 'recruiter@vectorhire.ai',
            name: meta.full_name || meta.name || session.user.email?.split('@')[0] || 'Recruiter Admin',
            role: meta.role || 'Talent Lead',
            avatarUrl: meta.avatar_url,
          });
          setLoading(false);
        } else {
          // Check if demo user is stored
          checkStoredDemoUser();
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          setUser({
            id: session.user.id,
            email: session.user.email || 'recruiter@vectorhire.ai',
            name: meta.full_name || meta.name || session.user.email?.split('@')[0] || 'Recruiter Admin',
            role: meta.role || 'Talent Lead',
            avatarUrl: meta.avatar_url,
          });
        } else if (event === 'SIGNED_OUT') {
          checkStoredDemoUser();
        }
      });

      return () => {
        authListener?.subscription.unsubscribe();
      };
    } else {
      checkStoredDemoUser();
    }
  }, []);

  const checkStoredDemoUser = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(DEMO_USER_KEY);
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      } else {
        // Default demo user initialized for smooth local development
        const defaultUser: AuthUser = {
          id: 'demo-admin-01',
          email: 'admin@vectorhire.ai',
          name: 'Talent Operations Lead',
          role: 'Admin Workspace',
          workspaceName: 'Enterprise Recruiting',
        };
        setUser(defaultUser);
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(defaultUser));
      }
    }
    setLoading(false);
  };

  const signInWithPassword = async (email: string, password: string) => {
    const supabase = getSupabaseAuthClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: error.message };
      }
      if (data.user) {
        const meta = data.user.user_metadata || {};
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: meta.full_name || meta.name || email.split('@')[0],
          role: meta.role || 'Recruiting Admin',
        };
        setUser(authUser);
        localStorage.removeItem(DEMO_USER_KEY);
        router.push('/dashboard');
      }
      return {};
    } else {
      // Fallback demo sign in
      signInWithDemo('Recruiter Admin', email.split('@')[0]);
      router.push('/dashboard');
      return {};
    }
  };

  const signUpWithPassword = async (email: string, password: string, name: string) => {
    const supabase = getSupabaseAuthClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'Talent Acquisition',
          },
        },
      });
      if (error) {
        return { error: error.message };
      }
      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: name || email.split('@')[0],
          role: 'Talent Acquisition',
        };
        setUser(authUser);
        localStorage.removeItem(DEMO_USER_KEY);
        router.push('/dashboard');
      }
      return {};
    } else {
      signInWithDemo('Recruiter', name);
      router.push('/dashboard');
      return {};
    }
  };

  const signInWithDemo = (role = 'Talent Lead', name = 'Demo Recruiter') => {
    const demoUser: AuthUser = {
      id: 'demo-user-' + Date.now(),
      email: 'recruiter@vectorhire.ai',
      name: name,
      role: role,
    };
    setUser(demoUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    }
    router.push('/dashboard');
  };

  const signOut = async () => {
    const supabase = getSupabaseAuthClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEMO_USER_KEY);
    }
    setUser(null);
    router.push('/login');
  };

  const updateWorkspace = (name: string) => {
    setWorkspaceName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem(WORKSPACE_KEY, name);
    }
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        workspaceName,
        signInWithPassword,
        signUpWithPassword,
        signInWithDemo,
        signOut,
        updateWorkspace,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
