import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider, useSession } from './context/SessionContext';
import { LanguageProvider } from './context/LanguageContext';
import { ConversationProvider } from './context/ConversationContext';
import { ModelProvider } from './context/ModelContext';
import Auth from './components/Auth';
import InvitationCode from './components/InvitationCode';
import ChatWindow from './components/ChatWindow';
import { AgentTaskService } from './services/agentTaskService';
import { chat, webSearch } from './api/orcha';
import type { ChatRequest, WebSearchRequest } from './types/orcha';
import AgentNotification, { type AgentNotificationData } from './components/AgentNotification';

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
  const { user, isAuthenticated, loading, pendingInvitation } = useAuth();
  const { session, login } = useSession();
  const [agentNotification, setAgentNotification] = useState<AgentNotificationData | null>(null);

  // Sync authenticated user with session
  useEffect(() => {
    if (user && !session && !pendingInvitation) {
      // Create session from authenticated user ONLY if invitation is not pending
      login(user.id.toString(), undefined);
    }
  }, [user, session, login, pendingInvitation]);

  // Agent Task Scheduler
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    console.log('🤖 Agent Task Scheduler initialized');

    // Execute agent task
    const executeAgentTask = async (task: any) => {
      console.log('🚀 Executing agent task:', task.taskName, task.isSearch ? '(Web Search)' : '(Chat)');

      try {
        let response;

        if (task.isSearch) {
          // Execute as web search
          const searchRequest: WebSearchRequest = {
            user_id: user.id.toString(),
            tenant_id: session?.tenant_id,
            query: task.instructions,
            max_results: 5
          };

          response = await webSearch(searchRequest);
        } else {
          // Execute as regular chat
          const chatRequest: ChatRequest = {
            user_id: user.id.toString(),
            tenant_id: session?.tenant_id,
            message: task.instructions,
            use_rag: false,
            conversation_history: []
          };

          response = await chat(chatRequest);
        }

        if (response.status === 'ok' && response.message) {
          // Show notification with slight delay to ensure visibility
          setTimeout(() => {
            const notification: AgentNotificationData = {
              id: Date.now().toString(),
              taskName: task.taskName + (task.isSearch ? ' 🌐' : ''),
              message: response.message || '',
              timestamp: new Date().toISOString()
            };

            setAgentNotification(notification);
            console.log('✅ Agent task completed - notification displayed');
          }, 500);
        }
      } catch (error) {
        console.error('❌ Agent task execution failed:', error);
      }
    };

    // Check for scheduled tasks
    const checkTasks = () => {
      const tasksToRun = AgentTaskService.checkScheduledTasks();

      if (tasksToRun.length > 0) {
        console.log(`🔔 ${tasksToRun.length} agent task(s) ready to execute`);
        tasksToRun.forEach(task => {
          executeAgentTask(task);
        });
      }
    };

    // Check immediately on startup
    checkTasks();

    // Check every minute
    const intervalId = setInterval(checkTasks, 60000);

    return () => {
      clearInterval(intervalId);
      console.log('🤖 Agent Task Scheduler stopped');
    };
  }, [isAuthenticated, user, session]);

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

  return (
    <>
      {isAuthenticated ? (
        pendingInvitation ? (
          <InvitationCode />
        ) : (
          session ? <ChatWindow /> : <div>Loading...</div>
        )
      ) : (
        <Auth />
      )}
      <AgentNotification
        notification={agentNotification}
        onClose={() => setAgentNotification(null)}
      />
    </>
  );
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

