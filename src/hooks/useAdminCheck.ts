import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

/**
 * Hook to check if the current user is an admin
 * Returns admin status and authentication state
 */
export const useAdminCheck = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        setUser(user);

        if (user) {
          // Check admin status
          const { data: adminCheck, error } = await supabase.rpc("is_admin");
          
          if (error) {
            console.error("Admin check failed:", error);
            setIsAdmin(false);
          } else {
            setIsAdmin(adminCheck || false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsAdmin(false);
      } else {
        // Re-check admin status when user changes
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    isAdmin,
    isLoading,
    isAuthenticated: !!user,
  };
};