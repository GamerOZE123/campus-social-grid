import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ChatContextType {
  unreadChats: Set<string>;
  hasUnreadMessages: boolean;
  markChatAsRead: (userId: string) => void;
  addUnreadChat: (userId: string) => void;
  chatMovedIndicator: string | null;
  setChatMovedIndicator: (userId: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadChats, setUnreadChats] = useState<Set<string>>(new Set());
  const [chatMovedIndicator, setChatMovedIndicator] = useState<string | null>(null);

  const hasUnreadMessages = unreadChats.size > 0;

  const markChatAsRead = (userId: string) => {
    setUnreadChats(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  const addUnreadChat = (userId: string) => {
    setUnreadChats(prev => new Set(prev).add(userId));
  };

  // Listen for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const message = payload.new;
          if (message.sender_id !== user.id) {
            addUnreadChat(message.sender_id);
            setChatMovedIndicator(message.sender_id);
            // Clear the indicator after 3 seconds
            setTimeout(() => setChatMovedIndicator(null), 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <ChatContext.Provider value={{
      unreadChats,
      hasUnreadMessages,
      markChatAsRead,
      addUnreadChat,
      chatMovedIndicator,
      setChatMovedIndicator,
    }}>
      {children}
    </ChatContext.Provider>
  );
};