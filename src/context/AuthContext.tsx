// @refresh reset
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User, AuthResponse, JobTitle } from '../types/orcha';

interface PendingRegistration {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  pendingInvitation: boolean;
  pendingJobTitle: boolean;
  pendingRegistration: PendingRegistration | null;
  startRegistration: (username: string, email: string, password: string, fullName?: string) => void;
  completeRegistration: (jobTitle: JobTitle) => Promise<AuthResult>;
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
  const [pendingJobTitle, setPendingJobTitle] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);

  // Load user and settings from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('aura_token');
    const savedUser = localStorage.getItem('aura_user');
    const savedPendingReg = localStorage.getItem('aura_pending_registration');
    const isPendingInvitation = localStorage.getItem('aura_pending_invitation') === 'true';
    const isPendingJobTitle = localStorage.getItem('aura_pending_job_title') === 'true';

    // Check if there's a pending registration (user in onboarding flow)
    if (savedPendingReg) {
      try {
        setPendingRegistration(JSON.parse(savedPendingReg));
        setPendingInvitation(isPendingInvitation);
        setPendingJobTitle(isPendingJobTitle);
      } catch (error) {
        console.error('Failed to parse pending registration:', error);
        localStorage.removeItem('aura_pending_registration');
      }
    } else if (savedToken && savedUser) {
      // Existing logged in user
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setPendingInvitation(isPendingInvitation);
        setPendingJobTitle(isPendingJobTitle);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_user');
        localStorage.removeItem('aura_pending_invitation');
        localStorage.removeItem('aura_pending_job_title');
      }
    }
    setLoading(false);
  }, []);

  // Step 1: Start registration - store data locally and move to invitation code
  const startRegistration = (
    username: string,
    email: string,
    password: string,
    fullName: string = ''
  ): void => {
    const regData: PendingRegistration = {
      username,
      email,
      password,
      fullName
    };

    setPendingRegistration(regData);
    setPendingInvitation(true);

    localStorage.setItem('aura_pending_registration', JSON.stringify(regData));
    localStorage.setItem('aura_pending_invitation', 'true');

    console.log('📝 Registration data saved, moving to invitation code step');
  };

  // Step 3: Complete registration - call API with all data including job title
  const completeRegistration = async (jobTitle: JobTitle): Promise<AuthResult> => {
    if (!pendingRegistration) {
      return { success: false, error: 'No pending registration data' };
    }

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: pendingRegistration.username,
          email: pendingRegistration.email,
          password: pendingRegistration.password,
          full_name: pendingRegistration.fullName || null,
          job_title: jobTitle
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

      // Clear pending states
      setPendingRegistration(null);
      setPendingInvitation(false);
      setPendingJobTitle(false);

      localStorage.removeItem('aura_pending_registration');
      localStorage.removeItem('aura_pending_invitation');
      localStorage.removeItem('aura_pending_job_title');
      localStorage.setItem('aura_token', data.access_token);
      localStorage.setItem('aura_user', JSON.stringify(data.user));

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
      setPendingJobTitle(false); // Existing users already have job title set

      localStorage.setItem('aura_token', data.access_token);
      localStorage.setItem('aura_user', JSON.stringify(data.user));
      localStorage.removeItem('aura_pending_invitation');
      localStorage.removeItem('aura_pending_job_title');

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
    setPendingJobTitle(false);
    setPendingRegistration(null);
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_user');
    localStorage.removeItem('aura_pending_invitation');
    localStorage.removeItem('aura_pending_job_title');
    localStorage.removeItem('aura_pending_registration');
    console.log('👋 User logged out');
  };

  // Complete invitation - now moves to job title selection
  const completeInvitation = () => {
    setPendingInvitation(false);
    setPendingJobTitle(true);
    localStorage.removeItem('aura_pending_invitation');
    localStorage.setItem('aura_pending_job_title', 'true');
    console.log('✅ Invitation code verified - now select job title');
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

  // For the registration flow, we're "authenticated" if we have pending registration data
  const isInRegistrationFlow = !!pendingRegistration;

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: (!!token && !!user) || isInRegistrationFlow,
    pendingInvitation,
    pendingJobTitle,
    pendingRegistration,
    startRegistration,
    completeRegistration,
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

