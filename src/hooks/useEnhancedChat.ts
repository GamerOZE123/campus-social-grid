import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EnhancedConversation {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  other_user_university: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_other_user_online: boolean;
  last_seen: string;
  is_typing: boolean;
}

interface EnhancedMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  reply_to_message_id?: string;
  message_type: 'text' | 'image' | 'file' | 'reply';
  media_url?: string;
  media_type?: string;
  status?: 'sent' | 'delivered' | 'read';
  reactions?: MessageReaction[];
}

interface MessageReaction {
  id: string;
  user_id: string;
  reaction_type: 'heart' | 'like' | 'laugh' | 'wow' | 'sad' | 'angry';
  created_at: string;
}

export const useEnhancedChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<EnhancedConversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<EnhancedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch enhanced conversations with all professional features
  const fetchEnhancedConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_enhanced_conversations', {
        target_user_id: user.id,
      });
      
      if (error) throw error;
      
      // Filter out deleted conversations
      const { data: deleted } = await supabase
        .from('deleted_chats')
        .select('conversation_id')
        .eq('user_id', user.id);
      
      const deletedIds = deleted?.map((d) => d.conversation_id) || [];
      const filteredConversations = (data || []).filter(
        (conv: EnhancedConversation) => !deletedIds.includes(conv.conversation_id)
      );
      
      setConversations(filteredConversations);
    } catch (error) {
      console.error('Error fetching enhanced conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages with enhanced features (reactions, replies, status)
  const fetchEnhancedMessages = useCallback(async (conversationId: string, offset = 0, limit = 20) => {
    if (!user) return;
    
    try {
      setActiveConversationId(conversationId);
      
      // Check for cleared chats
      const { data: clearedData } = await supabase
        .from('cleared_chats')
        .select('cleared_at')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .maybeSingle();

      // Fetch messages with reactions and status
      let query = supabase
        .from('messages')
        .select(`
          *,
          message_reactions (
            id,
            user_id,
            reaction_type,
            created_at
          ),
          message_status!inner (
            status
          )
        `)
        .eq('conversation_id', conversationId)
        .eq('message_status.user_id', user.id);

      if (clearedData?.cleared_at) {
        query = query.gt('created_at', clearedData.cleared_at);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const enhancedMessages: EnhancedMessage[] = (data || []).map((msg: any) => ({
        ...msg,
        status: msg.message_status?.[0]?.status || 'sent',
        reactions: msg.message_reactions || []
      }));

      if (offset === 0) {
        setCurrentMessages(enhancedMessages.reverse());
      } else {
        setCurrentMessages((prev) => [...enhancedMessages.reverse(), ...prev]);
      }

      // Mark messages as read
      await markMessagesAsRead(conversationId);
      
    } catch (error) {
      console.error('Error fetching enhanced messages:', error);
      if (offset === 0) setCurrentMessages([]);
    }
  }, [user]);

  // Send enhanced message with optimistic updates
  const sendEnhancedMessage = useCallback(async (
    conversationId: string, 
    content: string, 
    messageType: 'text' | 'image' | 'file' | 'reply' = 'text',
    replyToMessageId?: string,
    mediaUrl?: string,
    mediaType?: string
  ) => {
    if (!user || !content.trim()) {
      return { success: false, error: 'No user or empty content' };
    }

    // Optimistic update
    const optimisticMessage: EnhancedMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      created_at: new Date().toISOString(),
      message_type: messageType,
      reply_to_message_id: replyToMessageId,
      media_url: mediaUrl,
      media_type: mediaType,
      status: 'sending' as any,
      reactions: []
    };

    setCurrentMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          message_type: messageType,
          reply_to_message_id: replyToMessageId,
          media_url: mediaUrl,
          media_type: mediaType,
        })
        .select()
        .single();

      if (error) throw error;

      // Update optimistic message with real data
      setCurrentMessages((prev) => 
        prev.map((msg) => 
          msg.id === optimisticMessage.id 
            ? { 
                ...data, 
                status: 'sent' as const, 
                reactions: [],
                message_type: (data.message_type || 'text') as 'text' | 'image' | 'file' | 'reply'
              }
            : msg
        )
      );

      return { success: true, data };
    } catch (error) {
      console.error('Error sending enhanced message:', error);
      
      // Remove failed optimistic message
      setCurrentMessages((prev) => 
        prev.filter((msg) => msg.id !== optimisticMessage.id)
      );
      
      return { success: false, error: (error as Error).message };
    }
  }, [user]);

  // Mark messages as read (Instagram/WhatsApp style)
  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    try {
      await supabase.rpc('mark_messages_as_read', {
        conversation_uuid: conversationId,
        reader_user_id: user.id
      });
      
      // Update local state
      setCurrentMessages((prev) => 
        prev.map((msg) => 
          msg.sender_id !== user.id 
            ? { ...msg, status: 'read' }
            : msg
        )
      );
      
      // Refresh conversations to update unread counts
      fetchEnhancedConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user, fetchEnhancedConversations]);

  // Add reaction to message (Instagram style)
  const addReaction = useCallback(async (messageId: string, reactionType: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          reaction_type: reactionType
        });

      if (error) throw error;

      // Update local state optimistically
      setCurrentMessages((prev) => 
        prev.map((msg) => {
          if (msg.id === messageId) {
            const existingReactions = msg.reactions?.filter(r => 
              !(r.user_id === user.id && r.reaction_type === reactionType)
            ) || [];
            
            return {
              ...msg,
              reactions: [
                ...existingReactions,
                {
                  id: `temp-${Date.now()}`,
                  user_id: user.id,
                  reaction_type: reactionType as any,
                  created_at: new Date().toISOString()
                }
              ]
            };
          }
          return msg;
        })
      );
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  }, [user]);

  // Remove reaction from message
  const removeReaction = useCallback(async (messageId: string, reactionType: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType);

      if (error) throw error;

      // Update local state
      setCurrentMessages((prev) => 
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: msg.reactions?.filter(r => 
                !(r.user_id === user.id && r.reaction_type === reactionType)
              ) || []
            };
          }
          return msg;
        })
      );
    } catch (error) {
      console.error('Error removing reaction:', error);
      toast.error('Failed to remove reaction');
    }
  }, [user]);

  // Update typing status (professional chat feature)
  const updateTypingStatus = useCallback(async (conversationId: string, typing: boolean) => {
    if (!user) return;
    
    try {
      await supabase.rpc('update_typing_status', {
        conversation_uuid: conversationId,
        typing_user_id: user.id,
        typing_state: typing
      });
      
      setIsTyping(typing);
      
      // Clear typing after 3 seconds of inactivity
      if (typing) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
          updateTypingStatus(conversationId, false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [user]);

  // Update user presence (Instagram online status)
  const updatePresence = useCallback(async (isOnline: boolean) => {
    if (!user) return;
    
    try {
      await supabase.rpc('update_user_presence', {
        target_user_id: user.id,
        online_status: isOnline,
        presence_status: isOnline ? 'online' : 'offline'
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user]);

  // Set up real-time subscriptions for professional features
  useEffect(() => {
    if (!user) return;

    // Message updates
    const messageChannel = supabase
      .channel('enhanced-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as any;
            if (newMessage.conversation_id === activeConversationId) {
              setCurrentMessages((prev) => [...prev, {
                ...newMessage,
                status: newMessage.sender_id === user.id ? 'sent' : 'delivered',
                reactions: []
              }]);
            }
          }
          fetchEnhancedConversations();
        }
      )
      .subscribe();

    // Typing indicators
    const typingChannel = supabase
      .channel('typing-indicators')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'typing_status' },
        (payload) => {
          const typingStatus = payload.new as any;
          if (typingStatus?.conversation_id === activeConversationId && 
              typingStatus?.user_id !== user.id) {
            
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              if (typingStatus.is_typing) {
                newSet.add(typingStatus.user_id);
              } else {
                newSet.delete(typingStatus.user_id);
              }
              return newSet;
            });
          }
        }
      )
      .subscribe();

    // Reactions
    const reactionsChannel = supabase
      .channel('message-reactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        (payload) => {
          const reaction = payload.new as any;
          if (payload.eventType === 'INSERT') {
            setCurrentMessages((prev) => 
              prev.map((msg) => {
                if (msg.id === reaction.message_id) {
                  return {
                    ...msg,
                    reactions: [...(msg.reactions || []), reaction]
                  };
                }
                return msg;
              })
            );
          }
        }
      )
      .subscribe();

    // Update presence on mount
    updatePresence(true);

    // Update presence on page visibility
    const handleVisibilityChange = () => {
      updatePresence(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(reactionsChannel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      updatePresence(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, activeConversationId, fetchEnhancedConversations, updatePresence]);

  return {
    conversations,
    currentMessages,
    loading,
    typingUsers,
    isTyping,
    fetchEnhancedConversations,
    fetchEnhancedMessages,
    sendEnhancedMessage,
    markMessagesAsRead,
    addReaction,
    removeReaction,
    updateTypingStatus,
    updatePresence,
    activeConversationId,
    setActiveConversationId
  };
};