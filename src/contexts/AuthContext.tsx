import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, OperationType, handleSupabaseError } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileSubscription: any = null;

    const fetchProfile = async (currentUser: User) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') { // Not found
            const newProfile = {
              id: currentUser.id,
              name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuário',
              handle: `@${(currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'user').toLowerCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}`,
              avatar: currentUser.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${currentUser.id}`,
              verified: false,
            };
            const { data: createdProfile, error: insertError } = await supabase
              .from('users')
              .insert([newProfile])
              .select()
              .single();
              
            if (insertError) throw insertError;
            setProfile(createdProfile);
          } else {
            throw error;
          }
        } else {
          setProfile(data);
        }

        // Subscribe to real-time changes for this user profile
        profileSubscription = supabase
          .channel(`public:users:id=eq.${currentUser.id}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${currentUser.id}` }, (payload) => {
            setProfile(payload.new);
          })
          .subscribe();

      } catch (error) {
        handleSupabaseError(error, OperationType.GET, 'users');
      }
    };

    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user).finally(() => setLoading(false));
        } else {
          if (profileSubscription) supabase.removeChannel(profileSubscription);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (profileSubscription) supabase.removeChannel(profileSubscription);
    };
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/app'
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
