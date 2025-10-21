import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SessionProvider, useSession } from './context/SessionContext';
import { LanguageProvider } from './context/LanguageContext';
import { ConversationProvider } from './context/ConversationContext';
import { ModelProvider } from './context/ModelContext';
import Login from './components/Login';
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
  const { session } = useSession();

  return session ? <ChatWindow /> : <Login />;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <SessionProvider>
          <ModelProvider>
            <ConversationProvider>
              <AppContent />
            </ConversationProvider>
          </ModelProvider>
        </SessionProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;

