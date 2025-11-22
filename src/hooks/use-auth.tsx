
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type User } from '@supabase/supabase-js';

export function useAuth() {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null); // Add role state

  useEffect(() => {
    const getUserAndRole = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUser(userData.user);

      if (userData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userData.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile role:', profileError.message);
          setRole(null);
        } else {
          setRole(profileData?.role ?? null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    };

    getUserAndRole();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setCurrentUser(session?.user ?? null);
        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching profile role on auth change:', profileError.message);
            setRole(null);
          } else {
            setRole(profileData?.role ?? null);
          }
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { currentUser, loading, role };
}
