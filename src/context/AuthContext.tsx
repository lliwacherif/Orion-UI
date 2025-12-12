// @refresh reset
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User, AuthResponse } from '../types/orcha';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  pendingInvitation: boolean;
  register: (username: string, email: string, password: string, fullName?: string) => Promise<AuthResult>;
  login: (username: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  completeInvitation: () => void;
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [pendingInvitation, setPendingInvitation] = useState(false);

  // Load user and settings from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('aura_token');
    const savedUser = localStorage.getItem('aura_user');
    const isPending = localStorage.getItem('aura_pending_invitation') === 'true';

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setPendingInvitation(isPending);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_user');
        localStorage.removeItem('aura_pending_invitation');
      }
    }
    setLoading(false);
  }, []);

  // Register new user
  const register = async (
    username: string,
    email: string,
    password: string,
    fullName: string = ''
  ): Promise<AuthResult> => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const data: AuthResponse = await response.json();

      // Save to state and localStorage
      setToken(data.access_token);
      setUser(data.user);

      // NEW: Set pending invitation flag for new users
      setPendingInvitation(true);

      localStorage.setItem('aura_token', data.access_token);
      localStorage.setItem('aura_user', JSON.stringify(data.user));
      localStorage.setItem('aura_pending_invitation', 'true');

      console.log('✅ Registration successful:', data.user);
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  // Login existing user
  const login = async (username: string, password: string): Promise<AuthResult> => {
    try {
      const payload = { username, password };
      console.log('🔐 Attempting login...');
      // ... existing logs ...

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Login response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const error = await response.json();
          errorMessage = error.detail || error.message || 'Login failed';
        } catch (e) {
          console.error('Failed to parse error response');
        }
        throw new Error(errorMessage);
      }

      const data: AuthResponse = await response.json();

      // Save to state and localStorage
      setToken(data.access_token);
      setUser(data.user);
      setPendingInvitation(false); // Login assumes existing user who has already passed check (or legacy user)

      localStorage.setItem('aura_token', data.access_token);
      localStorage.setItem('aura_user', JSON.stringify(data.user));
      localStorage.removeItem('aura_pending_invitation');

      console.log('✅ Login successful:', data.user);
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    setPendingInvitation(false);
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_user');
    localStorage.removeItem('aura_pending_invitation');
    console.log('👋 User logged out');
  };

  // Complete invitation
  const completeInvitation = () => {
    setPendingInvitation(false);
    localStorage.removeItem('aura_pending_invitation');
    console.log('✅ Invitation code verified');
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh user');
      }

      const userData: User = await response.json();
      setUser(userData);
      localStorage.setItem('aura_user', JSON.stringify(userData));
      console.log('🔄 User data refreshed');
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout(); // Token might be expired
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    pendingInvitation,
    register,
    login,
    logout,
    refreshUser,
    completeInvitation
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

