import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export type UserRole = 'customer' | 'laundry_master' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  phone?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AUTH_STORAGE_KEY = 'auth_user';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Load user from storage on app start
  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (email: string, password: string, role?: UserRole) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      // TODO: Implement actual login with backend
      // For now, create a mock user based on role
      let userRole: UserRole = role || 'customer';
      
      // Admin login check
      if (email === 'admin@laundryhub.com' && password === 'admin123') {
        userRole = 'admin';
      }
      // Laundry master login check
      else if (email.includes('master') || role === 'laundry_master') {
        userRole = 'laundry_master';
      }
      
      const mockUser: User = {
        id: Date.now().toString(),
        email,
        firstName: email.split('@')[0],
        lastName: 'User',
        name: email.split('@')[0] + ' User',
        role: userRole,
      };
      
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      setAuthState({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });
      return { success: true };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Login failed' };
    }
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string, role: UserRole) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      // TODO: Implement actual signup with backend
      const newUser: User = {
        id: Date.now().toString(),
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        role,
      };
      
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      setAuthState({
        user: newUser,
        isLoading: false,
        isAuthenticated: true,
      });
      return { success: true };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Signup failed' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUserLocation = async (location: User['location']) => {
    if (authState.user) {
      const updatedUser = { ...authState.user, location };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      setAuthState(prev => ({ ...prev, user: updatedUser }));
    }
  };

  return {
    ...authState,
    login,
    signup,
    logout,
    updateUserLocation,
  };
});