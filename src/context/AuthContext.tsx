import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string | { email: string; password?: string; rememberMe?: boolean }, password?: string) => Promise<User>;
  adminLogin: (email: string, password?: string) => Promise<User>;
  register: (nameOrData: string | { name: string; email: string; password?: string; organization?: string }, email?: string, password?: string) => Promise<User>;
  registerAdmin: (data: { name: string; email: string; password: string; adminSecretKey: string; organization?: string; phone?: string; roleTitle?: string }) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  updateUser: (data: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check cached session and verify with backend
    const initializeAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (err) {
        console.warn('[AuthContext] Session initialization warning:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (
    emailOrObj: string | { email: string; password?: string; rememberMe?: boolean },
    password = ''
  ): Promise<User> => {
    setIsLoading(true);
    try {
      const email = typeof emailOrObj === 'string' ? emailOrObj : emailOrObj.email;
      const pwd = typeof emailOrObj === 'string' ? password : (emailOrObj.password || '');
      const user = await authService.login(email, pwd);
      setCurrentUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (email: string, password = ''): Promise<User> => {
    return login(email, password);
  };

  const register = async (
    nameOrData: string | { name: string; email: string; password?: string; organization?: string; phone?: string },
    emailStr?: string,
    passwordStr = ''
  ): Promise<User> => {
    setIsLoading(true);
    try {
      let name = '';
      let email = '';
      let password = '';
      let organization: string | undefined;
      let phone: string | undefined;

      if (typeof nameOrData === 'object') {
        name = nameOrData.name;
        email = nameOrData.email;
        password = nameOrData.password || '';
        organization = nameOrData.organization;
        phone = (nameOrData as any).phone;
      } else {
        name = nameOrData;
        email = emailStr || '';
        password = passwordStr;
      }

      const user = await authService.register({
        name,
        email,
        password,
        organization,
        phone,
      });
      setCurrentUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerAdmin = async (data: {
    name: string;
    email: string;
    password: string;
    adminSecretKey: string;
    organization?: string;
    phone?: string;
    roleTitle?: string;
  }): Promise<User> => {
    setIsLoading(true);
    try {
      const user = await authService.registerAdmin(data);
      setCurrentUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<User> => {
    if (!currentUser) throw new Error('Not authenticated');
    const updated = await authService.updateProfile(currentUser.id, data);
    setCurrentUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        adminLogin,
        register,
        registerAdmin,
        logout,
        updateProfile,
        updateUser: updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
