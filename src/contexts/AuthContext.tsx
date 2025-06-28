import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Farmer } from '@/types';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  farmer: Farmer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          api.setToken(token);
          const response = await api.getCurrentUser();
          if (response.data) {
            setUser(response.data.user);
            if (response.data.farmer) {
              setFarmer(response.data.farmer);
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('auth_token');
          api.removeToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      if (response.data) {
        const { user, farmer, token } = response.data;
        api.setToken(token);
        setUser(user);
        if (farmer) {
          setFarmer(farmer);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await api.register(userData);
      if (response.data) {
        const { user, token } = response.data;
        api.setToken(token);
        setUser(user);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    api.removeToken();
    setUser(null);
    setFarmer(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value = {
    user,
    farmer,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};