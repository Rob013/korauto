import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'user' | 'anonymous';

export interface UserPermissions {
  canAccessAdvancedFilters: boolean;
  canAccessBulkOperations: boolean;
  canAccessAdminDashboard: boolean;
  canModifyUserData: boolean;
  canViewAllCars: boolean;
  canExportData: boolean;
  maxFilterApiCalls: number;
  maxConcurrentSearches: number;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  permissions: UserPermissions;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkRole: () => Promise<void>;
}

// Default permissions for each role
const getPermissionsByRole = (role: UserRole): UserPermissions => {
  switch (role) {
    case 'admin':
      return {
        canAccessAdvancedFilters: true,
        canAccessBulkOperations: true,
        canAccessAdminDashboard: true,
        canModifyUserData: true,
        canViewAllCars: true,
        canExportData: true,
        maxFilterApiCalls: 1000,
        maxConcurrentSearches: 10,
      };
    case 'user':
      return {
        canAccessAdvancedFilters: true,
        canAccessBulkOperations: false,
        canAccessAdminDashboard: false,
        canModifyUserData: false,
        canViewAllCars: true,
        canExportData: false,
        maxFilterApiCalls: 100,
        maxConcurrentSearches: 3,
      };
    case 'anonymous':
    default:
      return {
        canAccessAdvancedFilters: false,
        canAccessBulkOperations: false,
        canAccessAdminDashboard: false,
        canModifyUserData: false,
        canViewAllCars: false,
        canExportData: false,
        maxFilterApiCalls: 20,
        maxConcurrentSearches: 1,
      };
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('anonymous');
  const [isLoading, setIsLoading] = useState(true);

  const permissions = getPermissionsByRole(role);
  const isAuthenticated = !!user;

  const checkRole = async () => {
    if (!user) {
      setRole('anonymous');
      return;
    }

    try {
      const { data: adminCheck, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Role check failed:', error);
        setRole('user'); // Default to user role on error
        return;
      }

      setRole(adminCheck ? 'admin' : 'user');
    } catch (error) {
      console.error('Admin check failed:', error);
      setRole('user');
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      setUser(data.user);
      await checkRole();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setRole('anonymous');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Check initial auth state
    const getInitialUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        setUser(user);
        if (user) {
          await checkRole();
        } else {
          setRole('anonymous');
        }
      } catch (error) {
        console.error('Initial auth check failed:', error);
        setUser(null);
        setRole('anonymous');
      } finally {
        setIsLoading(false);
      }
    };

    getInitialUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkRole();
        } else {
          setRole('anonymous');
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    role,
    permissions,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};