import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider, useSession } from './context/SessionContext';
import { LanguageProvider } from './context/LanguageContext';
import { ConversationProvider } from './context/ConversationContext';
import { ModelProvider } from './context/ModelContext';
import Auth from './components/Auth';
import ChatWindow from './components/ChatWindow';

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppContent: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { session, login } = useSession();

  // Sync authenticated user with session
  useEffect(() => {
    if (user && !session) {
      // Create session from authenticated user
      login(user.id.toString(), undefined);
    }
  }, [user, session, login]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated && session ? <ChatWindow /> : <Auth />;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <ConversationProvider>
            <SessionProvider>
              <ModelProvider>
                <AppContent />
              </ModelProvider>
            </SessionProvider>
          </ConversationProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;

