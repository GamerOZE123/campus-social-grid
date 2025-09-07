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
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

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

  const fetchMessages = async (conversationId: string, offset = 0, limit = 20) => {
    try {
      if (!user) return;
      
      // Set current conversation ID for realtime filtering
      setCurrentConversationId(conversationId);
      
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
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      
      console.log('Fetched messages:', data);
      if (offset === 0) {
        setCurrentMessages(data || []);
      } else {
        // For older messages, prepend to beginning
        setCurrentMessages(prev => [...(data || []), ...prev]);
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
      
      // Create optimistic message with temporary ID
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`, // Temporary ID
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString()
      };
      
      // Add optimistic message immediately to UI
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
        console.error('Error sending message:', error);
        // Remove optimistic message on error
        setCurrentMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        return { success: false, error: error.message };
      }
      
      console.log('Message sent successfully:', data);
      
      // Replace optimistic message with real message
      setCurrentMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id ? data as Message : msg
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
          onConflict: 'cleared_chats_user_id_conversation_id_key' // ✅ correct constraint
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
            
            // If it's for the current conversation, check for duplicates and add
            if (payload.new?.conversation_id === currentConversationId) {
              const newMessage = payload.new as Message;
              setCurrentMessages(prev => {
                // Check if message already exists (prevent duplicates)
                const messageExists = prev.some(msg => 
                  msg.id === newMessage.id || 
                  (msg.id.startsWith('temp-') && msg.content === newMessage.content && msg.sender_id === newMessage.sender_id)
                );
                
                if (messageExists) {
                  return prev; // Skip if duplicate
                }
                
                // Add new message and sort by created_at to maintain order
                const updatedMessages = [...prev, newMessage];
                return updatedMessages.sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, currentMessages]);

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
