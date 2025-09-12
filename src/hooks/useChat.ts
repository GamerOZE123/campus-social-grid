import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  other_user_university: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export const useChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChatCleared, setIsChatCleared] = useState<boolean>(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      console.log('Fetching conversations for user:', user.id);
      const { data, error } = await supabase.rpc('get_user_conversations', {
        target_user_id: user.id
      });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }

      console.log('Fetched conversations:', data);
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string, offset = 0, limit = 15) => {
    try {
      if (!user) return;
      setActiveConversationId(conversationId);

      // Get the cleared_at timestamp for this user and conversation
      const { data: clearedData } = await supabase
        .from('cleared_chats')
        .select('cleared_at')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .single();

      setIsChatCleared(!!clearedData);

      console.log('Fetching messages for conversation:', conversationId);

      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId);

      if (clearedData?.cleared_at) {
        query = query.gt('created_at', clearedData.cleared_at);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      console.log('Fetched messages:', data);
      if (offset === 0) {
        setCurrentMessages(data?.reverse() || []);
      } else {
        setCurrentMessages(prev => [...(data?.reverse() || []), ...prev]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (offset === 0) {
        setCurrentMessages([]);
      }
    }
  };

  const loadOlderMessages = async (conversationId: string) => {
    const offset = currentMessages.length;
    await fetchMessages(conversationId, offset);
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user || !content.trim()) {
      console.log('Cannot send message: no user or empty content');
      return { success: false, error: 'No user or empty content' };
    }

    try {
      console.log('Sending message:', { conversationId, content, userId: user.id });

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
      }

      console.log('Message sent successfully:', data);
      await fetchMessages(conversationId);
      return { success: true, data };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: (error as Error).message };
    }
  };

  const createConversation = async (otherUserId: string) => {
    if (!user) return null;

    try {
      console.log('Creating conversation between:', user.id, 'and', otherUserId);
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: otherUserId
      });

      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }

      console.log('Conversation created/found:', data);
      await fetchConversations();
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const clearChat = async (conversationId: string) => {
    if (!user) return { success: false, error: 'No user' };

    try {
      const { error } = await supabase
        .from('cleared_chats')
        .upsert(
          {
            user_id: user.id,
            conversation_id: conversationId,
            cleared_at: new Date().toISOString()
          },
          {
            onConflict: 'cleared_chats_user_id_conversation_id_key'
          }
        );

      if (error) {
        console.error('Error clearing chat:', error);
        return { success: false, error: error.message };
      }

      setIsChatCleared(true);
      setCurrentMessages([]);
      console.log('Chat cleared successfully');
      return { success: true };
    } catch (error) {
      console.error('Error clearing chat:', error);
      return { success: false, error: (error as Error).message };
    }
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`messages-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new as Message;
          console.log('Realtime message received:', newMsg);

          if (newMsg.conversation_id === activeConversationId) {
            setCurrentMessages((prev) => [...prev, newMsg]);
          }

          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeConversationId]);

  return {
    conversations,
    currentMessages,
    loading,
    isChatCleared,
    fetchMessages,
    loadOlderMessages,
    sendMessage,
    createConversation,
    clearChat,
    refreshConversations: fetchConversations,
  };
};
