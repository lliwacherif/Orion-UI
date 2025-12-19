import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  Shield, Users, MessageSquare, Trash2, LogOut, 
  RefreshCw, Search, Settings, Eye, EyeOff, 
  ChevronDown, ChevronUp, AlertTriangle, Check,
  BarChart3, TrendingUp, Calendar, Mail, User
} from 'lucide-react';

interface UserData {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  job_title: string | null;
  is_active: boolean;
  plan_type: string;
  created_at: string;
  conversation_count: number;
  message_count: number;
  last_activity: string | null;
}

interface DashboardStats {
  total_users: number;
  active_users: number;
  total_conversations: number;
  total_messages: number;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const AdminDashboard: React.FC = () => {
  const { admin, token, logout } = useAdmin();
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'username' | 'conversation_count'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings form state
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Fetch users
      const usersRes = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
        setStats(usersData.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Delete user
  const handleDeleteUser = async (userId: number) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setDeleteConfirm(null);
        // Refresh stats
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // Update admin credentials
  const handleUpdateCredentials = async () => {
    if (!token || !admin) return;

    setSettingsError('');
    setSettingsSuccess('');

    if (!currentPassword) {
      setSettingsError('Current password is required');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setSettingsError('New passwords do not match');
      return;
    }

    if (newPassword && newPassword.length < 4) {
      setSettingsError('Password must be at least 4 characters');
      return;
    }

    setSettingsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_username: newUsername || undefined,
          new_password: newPassword || undefined
        })
      });

      if (res.ok) {
        setSettingsSuccess('Credentials updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setNewUsername('');
      } else {
        const error = await res.json();
        setSettingsError(error.detail || 'Failed to update credentials');
      }
    } catch (error) {
      setSettingsError('Failed to update credentials');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Filter and sort users
  const filteredUsers = users
    .filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'username') {
        comparison = a.username.localeCompare(b.username);
      } else if (sortBy === 'conversation_count') {
        comparison = a.conversation_count - b.conversation_count;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get job title emoji
  const getJobEmoji = (jobTitle: string | null) => {
    switch (jobTitle) {
      case 'Doctor': return '🩺';
      case 'Lawyer': return '⚖️';
      case 'Engineer': return '🔧';
      case 'Accountant': return '📊';
      default: return '👤';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Orion Admin</h1>
                <p className="text-xs text-white/60">Dashboard</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <div className="h-6 w-px bg-white/20" />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                <User className="w-4 h-4 text-amber-400" />
                <span className="text-white/80 text-sm font-medium">{admin?.username}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-5 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.total_users}</p>
                </div>
                <Users className="w-10 h-10 text-blue-400 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl rounded-2xl p-5 border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Active Users</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.active_users}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Conversations</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.total_conversations}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-purple-400 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-xl rounded-2xl p-5 border border-amber-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-300 text-sm font-medium">Messages</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.total_messages}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-amber-400 opacity-80" />
              </div>
            </div>
          </div>
        )}

        {/* Users Section */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                All Users
                <span className="text-sm font-normal text-white/60">({filteredUsers.length})</span>
              </h2>

              {/* Search & Sort */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent w-48"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="created_at">Join Date</option>
                  <option value="username">Username</option>
                  <option value="conversation_count">Chats</option>
                </select>

                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white transition"
                >
                  {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-white/60">
                No users found
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider hidden md:table-cell">Job</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">Chats</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-white/60 uppercase tracking-wider hidden sm:table-cell">Messages</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user.full_name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.full_name || user.username}</p>
                            <p className="text-white/50 text-sm">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-white/80">
                          <Mail className="w-4 h-4 text-white/40" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-sm text-white/80">
                          {getJobEmoji(user.job_title)} {user.job_title || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium">
                          {user.conversation_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center hidden sm:table-cell">
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                          {user.message_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Calendar className="w-4 h-4" />
                          {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {deleteConfirm === user.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                              title="Confirm delete"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-2 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg transition"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/10 w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                Admin Settings
              </h3>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setSettingsError('');
                  setSettingsSuccess('');
                }}
                className="p-1 text-white/60 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <p className="text-white/60 text-sm">
                Update your admin credentials. Enter your current password to make changes.
              </p>

              {/* Error/Success Messages */}
              {settingsError && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-red-300 text-sm">{settingsError}</p>
                </div>
              )}
              {settingsSuccess && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <p className="text-green-300 text-sm">{settingsSuccess}</p>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Username */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  New Username (optional)
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Leave empty to keep current"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  New Password (optional)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave empty to keep current"
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              {newPassword && (
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleUpdateCredentials}
                disabled={settingsLoading || !currentPassword}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {settingsLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Credentials'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;


