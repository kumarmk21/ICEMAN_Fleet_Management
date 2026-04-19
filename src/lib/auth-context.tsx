import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session, AuthError, RealtimeChannel } from '@supabase/supabase-js';
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

interface ModulePermission {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
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
  canView: (moduleKey: string) => boolean;
  canCreate: (moduleKey: string) => boolean;
  canEdit: (moduleKey: string) => boolean;
  canDelete: (moduleKey: string) => boolean;
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
  const [modulePermissions, setModulePermissions] = useState<Record<string, ModulePermission>>({});
  const [loading, setLoading] = useState(true);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

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
          setModulePermissions({});
          teardownRealtimeChannel();
          setLoading(false);
        }
      })();
    });

    return () => {
      subscription.unsubscribe();
      teardownRealtimeChannel();
    };
  }, []);

  function teardownRealtimeChannel() {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  }

  function setupRealtimePermissions(userId: string) {
    teardownRealtimeChannel();
    const channel = supabase
      .channel(`user_module_permissions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_module_permissions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadModulePermissions(userId);
        }
      )
      .subscribe();
    realtimeChannelRef.current = channel;
  }

  async function loadModulePermissions(userId: string) {
    const { data, error } = await supabase
      .from('user_module_permissions')
      .select('module_key, can_view, can_create, can_edit, can_delete')
      .eq('user_id', userId);

    if (error) {
      console.error('Error loading module permissions:', error);
      return;
    }

    const map: Record<string, ModulePermission> = {};
    for (const row of data ?? []) {
      map[row.module_key] = {
        can_view: row.can_view,
        can_create: row.can_create,
        can_edit: row.can_edit,
        can_delete: row.can_delete,
      };
    }
    setModulePermissions(map);
  }

  async function loadProfile(userId: string) {
    try {
      const { data: debugData } = await supabase.rpc('debug_auth_state');
      console.log('Debug auth state:', debugData);

      const { data, error } = await supabase
        .from('user_profiles')
        .select(`*, roles!user_profiles_role_id_fkey(role_name, permissions)`)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      const transformedData = data ? { ...data, role: data.roles } : null;
      setProfile(transformedData as any);

      if (userId) {
        await loadModulePermissions(userId);
        setupRealtimePermissions(userId);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setModulePermissions({});
    teardownRealtimeChannel();
  }

  const isAdmin = profile?.role?.role_name === 'Admin';
  const isFleetManager = profile?.role?.role_name === 'Fleet Manager';
  const isOperations = profile?.role?.role_name === 'Operations Executive';
  const isAccounts = profile?.role?.role_name === 'Accounts';

  function canView(moduleKey: string): boolean {
    if (isAdmin) return true;
    return modulePermissions[moduleKey]?.can_view === true;
  }

  function canCreate(moduleKey: string): boolean {
    if (isAdmin) return true;
    return modulePermissions[moduleKey]?.can_create === true;
  }

  function canEdit(moduleKey: string): boolean {
    if (isAdmin) return true;
    return modulePermissions[moduleKey]?.can_edit === true;
  }

  function canDelete(moduleKey: string): boolean {
    if (isAdmin) return true;
    return modulePermissions[moduleKey]?.can_delete === true;
  }

  function hasPermission(permission: string): boolean {
    if (isAdmin) return true;
    if (permission === 'all') return false;
    return canView(permission);
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
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
