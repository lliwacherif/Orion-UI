// @refresh reset
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface Admin {
  id: number;
  username: string;
  created_at: string;
}

interface AdminContextType {
  admin: Admin | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<AdminLoginResult>;
  logout: () => void;
  refreshAdmin: () => Promise<void>;
}

interface AdminLoginResult {
  success: boolean;
  error?: string;
  admin?: Admin;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load admin from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('orion_admin_token');
    const savedAdmin = localStorage.getItem('orion_admin');

    if (savedToken && savedAdmin) {
      try {
        setToken(savedToken);
        setAdmin(JSON.parse(savedAdmin));
      } catch (error) {
        console.error('Failed to parse saved admin:', error);
        localStorage.removeItem('orion_admin_token');
        localStorage.removeItem('orion_admin');
      }
    }
    setLoading(false);
  }, []);

  // Login admin
  const login = async (username: string, password: string): Promise<AdminLoginResult> => {
    try {
      console.log('🔐 Admin login attempt...');

      const response = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

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

      const data = await response.json();

      // Save to state and localStorage
      setToken(data.access_token);
      setAdmin(data.admin);

      localStorage.setItem('orion_admin_token', data.access_token);
      localStorage.setItem('orion_admin', JSON.stringify(data.admin));

      console.log('✅ Admin login successful:', data.admin);
      return { success: true, admin: data.admin };
    } catch (error: any) {
      console.error('❌ Admin login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('orion_admin_token');
    localStorage.removeItem('orion_admin');
    console.log('👋 Admin logged out');
  };

  // Refresh admin data
  const refreshAdmin = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/admin/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh admin');
      }

      const adminData: Admin = await response.json();
      setAdmin(adminData);
      localStorage.setItem('orion_admin', JSON.stringify(adminData));
      console.log('🔄 Admin data refreshed');
    } catch (error) {
      console.error('Failed to refresh admin:', error);
      logout(); // Token might be expired
    }
  };

  const value: AdminContextType = {
    admin,
    token,
    loading,
    isAuthenticated: !!token && !!admin,
    login,
    logout,
    refreshAdmin
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};


