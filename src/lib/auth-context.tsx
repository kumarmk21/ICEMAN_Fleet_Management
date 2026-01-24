import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface UserProfile {
  user_id: string;
  role_id: string;
  full_name: string;
  mobile_number: string | null;
  employee_code: string | null;
  status: string;
  role?: {
    role_name: string;
    permissions: any;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isFleetManager: boolean;
  isOperations: boolean;
  isAccounts: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    try {
      console.log('Loading profile for userId:', userId);

      // Debug: Check auth state
      const { data: debugData } = await supabase.rpc('debug_auth_state');
      console.log('Debug auth state:', debugData);

      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          roles!user_profiles_role_id_fkey(role_name, permissions)
        `)
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Profile query result:', { data, error });
      if (error) throw error;

      // Transform the data to have the expected structure
      const transformedData = data ? {
        ...data,
        role: data.roles
      } : null;

      setProfile(transformedData as any);
      console.log('Profile set:', transformedData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  function hasPermission(permission: string): boolean {
    if (!profile?.role) return false;
    const permissions = profile.role.permissions as any;
    return permissions?.all === true || permissions?.[permission] === true;
  }

  const isAdmin = profile?.role?.role_name === 'Admin';
  const isFleetManager = profile?.role?.role_name === 'Fleet Manager';
  const isOperations = profile?.role?.role_name === 'Operations Executive';
  const isAccounts = profile?.role?.role_name === 'Accounts';

  console.log('Auth state:', {
    profile,
    roleName: profile?.role?.role_name,
    isAdmin,
    loading
  });

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    hasPermission,
    isAdmin,
    isFleetManager,
    isOperations,
    isAccounts,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
