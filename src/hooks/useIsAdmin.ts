import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface UseIsAdminReturn {
  isAdmin: boolean;
  isLoading: boolean;
  user: User | null;
}

export const useIsAdmin = (): UseIsAdminReturn => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        setUser(user);

        if (userError || !user) {
          setIsAdmin(false);
          return;
        }

        // Check admin status using the existing RPC function
        const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin');

        if (adminError) {
          console.error('Admin check failed:', adminError);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(adminCheck || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (!currentUser) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // Re-check admin status when auth state changes
        try {
          setIsLoading(true);
          const { data: adminCheck } = await supabase.rpc('is_admin');
          setIsAdmin(adminCheck || false);
        } catch (error) {
          console.error('Error re-checking admin status:', error);
          setIsAdmin(false);
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, isLoading, user };
};