
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
      
      // Get the cleared_at timestamp for this user and conversation
      const { data: clearedData } = await supabase
        .from('cleared_chats')
        .select('cleared_at')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .single();
      
      setIsChatCleared(!!clearedData);
      
      console.log('Fetching messages for conversation:', conversationId);
      
      // Build the query with optional timestamp filter
      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId);
      
      // If chat was cleared, only fetch messages after the cleared timestamp
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
      return { success: false, error: error.message };
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
  .upsert({
    user_id: user.id,
    conversation_id: conversationId,
    cleared_at: new Date().toISOString()
  }, {
    onConflict: 'user_id,conversation_id'
  });


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
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
      
      // Set up real-time listener for new messages
      const channel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            console.log('New message received:', payload);
            // Refresh conversations to update order
            fetchConversations();
            
            // If it's for the current conversation, refresh messages
            if (payload.new?.conversation_id === currentMessages?.[0]?.conversation_id) {
              fetchMessages(payload.new.conversation_id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

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
    refreshConversations: fetchConversations
  };
};
