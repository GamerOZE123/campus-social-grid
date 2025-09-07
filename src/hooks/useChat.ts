import { useState, useEffect, useRef } from 'react';
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
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // Use ref to track current conversation ID for realtime updates
  const currentConversationIdRef = useRef<string | null>(null);
  
  // Update ref whenever currentConversationId changes
  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_conversations', {
        target_user_id: user.id
      });
      
      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string, offset = 0, limit = 20) => {
    if (!user) return;
    setCurrentConversationId(conversationId);

    try {
      const { data: clearedData } = await supabase
        .from('cleared_chats')
        .select('cleared_at')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .single();

      setIsChatCleared(!!clearedData);

      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId);

      if (clearedData?.cleared_at) {
        query = query.gt('created_at', clearedData.cleared_at);
      }

      const { data, error } = await query
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      if (offset === 0) {
        setCurrentMessages(data || []);
      } else {
        setCurrentMessages(prev => [...(data || []), ...prev]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (offset === 0) setCurrentMessages([]);
    }
  };

  const loadOlderMessages = async (conversationId: string) => {
    const offset = currentMessages.length;
    await fetchMessages(conversationId, offset);
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return { success: false, error: 'No user or empty content' };

    try {
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString()
      };

      // Optimistic update
      setCurrentMessages(prev => [...prev, optimisticMessage]);

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
        // rollback optimistic update
        setCurrentMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        return { success: false, error: error.message };
      }

      // Replace optimistic with real
      setCurrentMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticMessage.id ? (data as Message) : msg
        )
      );

      return { success: true, data };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: (error as Error).message };
    }
  };

  const createConversation = async (otherUserId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: otherUserId
      });

      if (error) throw error;

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
          { onConflict: 'cleared_chats_user_id_conversation_id_key' }
        );

      if (error) throw error;

      setIsChatCleared(true);
      setCurrentMessages([]);
      return { success: true };
    } catch (error) {
      console.error('Error clearing chat:', error);
      return { success: false, error: (error as Error).message };
    }
  };

  // Stable realtime subscription - only depends on user
  useEffect(() => {
    if (!user) return;

    fetchConversations();

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
          console.log('Realtime message received:', payload);

          const newMessage = payload.new as Message;

          // Always update conversations for sidebar ordering
          fetchConversations();

          // Only add to current messages if it's the open conversation
          // Use ref to get current value without recreating subscription
          if (newMessage.conversation_id === currentConversationIdRef.current) {
            setCurrentMessages((prev) => {
              // Check for duplicates
              const alreadyExists = prev.some(
                (msg) =>
                  msg.id === newMessage.id ||
                  (msg.sender_id === newMessage.sender_id &&
                   msg.content === newMessage.content &&
                   Math.abs(
                     new Date(msg.created_at).getTime() -
                     new Date(newMessage.created_at).getTime()
                   ) < 2000)
              );

              if (alreadyExists) {
                console.log('Message already exists, skipping');
                return prev;
              }

              console.log('Adding new message to current conversation');
              const updated = [...prev, newMessage];
              return updated.sort(
                (a, b) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime()
              );
            });
          } else {
            console.log('Message for different conversation, not adding to current messages');
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user]); // Only user as dependency - stable subscription

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