import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  selected_plan: string | null;
  plan_price: number | null;
  plan_duration: string | null;
  last_login: string | null;
  created_at: string;
}

export type AppRole = 'user' | 'admin' | 'super_admin';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, metadata: Record<string, string>) => Promise<{ success: boolean; message: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  adminSignIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>('user');
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) setProfile(data as Profile);

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    if (roleData && roleData.length > 0) {
      // Pick highest role
      const roles = roleData.map(r => r.role);
      if (roles.includes('super_admin')) setRole('super_admin');
      else if (roles.includes('admin')) setRole('admin');
      else setRole('user');
    }
    return data as Profile | null;
  };

  const refreshProfile = async () => {
    if (session?.user?.id) await fetchProfile(session.user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        // Use setTimeout to avoid deadlock with Supabase auth
        setTimeout(() => fetchProfile(sess.user.id), 0);
      } else {
        setProfile(null);
        setRole('user');
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) {
        fetchProfile(sess.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata: Record<string, string>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) return { success: false, message: error.message };
    // Sign out after signup so user can't access app until approved
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    return { success: true, message: 'Signup successful! Your account is pending admin approval.' };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: 'Invalid email or password.' };

    // Check profile status
    const { data: prof } = await supabase
      .from('profiles')
      .select('status')
      .eq('user_id', data.user.id)
      .single();

    if (!prof) return { success: false, message: 'Profile not found.' };

    if (prof.status === 'pending') {
      await supabase.auth.signOut();
      return { success: false, message: 'Your account is pending admin approval.' };
    }
    if (prof.status === 'rejected') {
      await supabase.auth.signOut();
      return { success: false, message: 'Your account has been rejected.' };
    }
    if (prof.status === 'disabled') {
      await supabase.auth.signOut();
      return { success: false, message: 'Your account has been disabled. Contact admin.' };
    }

    // Update last login
    await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('user_id', data.user.id);
    await fetchProfile(data.user.id);
    return { success: true, message: 'Login successful!' };
  };

  const adminSignIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: 'Invalid admin credentials.' };

    // Check role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id);

    const userRoles = roles?.map(r => r.role) || [];
    if (!userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      await supabase.auth.signOut();
      return { success: false, message: 'Access denied. Admin privileges required.' };
    }

    // Check profile status
    const { data: prof } = await supabase
      .from('profiles')
      .select('status')
      .eq('user_id', data.user.id)
      .single();

    if (prof?.status !== 'approved') {
      await supabase.auth.signOut();
      return { success: false, message: 'Account is not active.' };
    }

    await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('user_id', data.user.id);
    await fetchProfile(data.user.id);
    return { success: true, message: 'Admin login successful!' };
  };

  const signOutFn = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setRole('user');
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      role,
      loading,
      isAuthenticated: !!session && !!profile && profile.status === 'approved',
      isAdmin: role === 'admin' || role === 'super_admin',
      signUp,
      signIn,
      adminSignIn,
      signOut: signOutFn,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
