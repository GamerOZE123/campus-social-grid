import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/layout/MobileLayout';
import UserSearch from '@/components/chat/UserSearch';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';
import ConversationItem from '@/components/chat/ConversationItem';
import TypingIndicator from '@/components/chat/TypingIndicator';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, ArrowLeft, Trash2, MessageSquareX, UserX, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedChat } from '@/hooks/useEnhancedChat';
import { useUsers } from '@/hooks/useUsers';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  reactions?: any[];
}

export default function EnhancedChat() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserList, setShowUserList] = useState(true);
  const [replyToMessage, setReplyToMessage] = useState<EnhancedMessage | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    currentMessages,
    loading,
    typingUsers,
    fetchEnhancedConversations,
    fetchEnhancedMessages,
    sendEnhancedMessage,
    markMessagesAsRead,
    addReaction,
    removeReaction,
    updateTypingStatus,
    activeConversationId,
    setActiveConversationId
  } = useEnhancedChat();

  const { getUserById } = useUsers();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom && currentMessages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [currentMessages, isAtBottom]);

  // Mark messages as read when conversation is active
  useEffect(() => {
    if (activeConversationId) {
      markMessagesAsRead(activeConversationId);
    }
  }, [activeConversationId, markMessagesAsRead]);

  // Load conversations on mount
  useEffect(() => {
    fetchEnhancedConversations();
  }, [fetchEnhancedConversations]);

  const handleUserClick = async (userId: string) => {
    try {
      const userProfile = await getUserById(userId);
      if (!userProfile) {
        toast.error('Failed to load user profile');
        return;
      }

      setSelectedUser(userProfile);
      
      // Create or get conversation
      const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user!.id,
        user2_id: userId,
      });

      if (error) throw error;

      setActiveConversationId(conversationId);
      await fetchEnhancedMessages(conversationId);
      
      if (isMobile) setShowUserList(false);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const handleConversationClick = async (conversation: any) => {
    setSelectedUser({
      user_id: conversation.other_user_id,
      full_name: conversation.other_user_name,
      avatar_url: conversation.other_user_avatar,
      university: conversation.other_user_university
    });
    
    setActiveConversationId(conversation.conversation_id);
    await fetchEnhancedMessages(conversation.conversation_id);
    
    if (isMobile) setShowUserList(false);
  };

  const handleSendMessage = async (
    content: string,
    messageType: 'text' | 'image' | 'file' | 'reply' = 'text',
    replyToMessageId?: string,
    mediaUrl?: string,
    mediaType?: string
  ) => {
    if (!activeConversationId) return;

    await sendEnhancedMessage(
      activeConversationId,
      content,
      messageType,
      replyToMessageId,
      mediaUrl,
      mediaType
    );
  };

  const handleTyping = (isTyping: boolean) => {
    if (activeConversationId) {
      updateTypingStatus(activeConversationId, isTyping);
    }
  };

  const handleReply = (message: EnhancedMessage) => {
    setReplyToMessage(message);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setIsAtBottom(atBottom);
  };

  const handleClearChat = async () => {
    if (!activeConversationId) return;
    
    try {
      const { error } = await supabase.from('cleared_chats').upsert({
        user_id: user!.id,
        conversation_id: activeConversationId,
        cleared_at: new Date().toISOString(),
      });
      
      if (error) throw error;
      
      await fetchEnhancedMessages(activeConversationId);
      toast.success('Chat cleared');
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat');
    }
  };

  const handleDeleteChat = async () => {
    if (!activeConversationId || !selectedUser) return;
    
    try {
      const { error } = await supabase.from('deleted_chats').upsert({
        user_id: user!.id,
        conversation_id: activeConversationId,
        deleted_at: new Date().toISOString(),
      });
      
      if (error) throw error;
      
      setActiveConversationId(null);
      setSelectedUser(null);
      await fetchEnhancedConversations();
      toast.success('Chat deleted');
      
      if (isMobile) setShowUserList(true);
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const handleBlockUser = async () => {
    if (!selectedUser?.user_id) return;
    
    try {
      const { error } = await supabase.from('blocked_users').insert({
        blocker_id: user!.id,
        blocked_id: selectedUser.user_id,
      });
      
      if (error) throw error;
      
      toast.success('User blocked');
      setActiveConversationId(null);
      setSelectedUser(null);
      
      if (isMobile) setShowUserList(true);
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    }
  };

  const getTypingUserNames = () => {
    return Array.from(typingUsers).map(userId => {
      const conversation = conversations.find(c => c.other_user_id === userId);
      return conversation?.other_user_name || 'Someone';
    });
  };

  if (!isMobile) {
    return (
      <Layout>
        <div className="h-[calc(100vh-6rem)] flex gap-4 pt-2">
          {/* Left sidebar - conversations */}
          <div className="w-1/3 bg-card border border-border rounded-2xl p-4 overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">Messages</h2>
            
            <UserSearch onStartChat={handleUserClick} />
            
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Conversations
              </h3>
              
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
              
              {!loading && conversations.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No conversations yet. Start one by searching for users above!
                </p>
              )}
              
              {!loading && conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.conversation_id}
                  conversation={conversation}
                  isSelected={conversation.conversation_id === activeConversationId}
                  onClick={() => handleConversationClick(conversation)}
                />
              ))}
            </div>
          </div>

          {/* Right side - chat interface */}
          <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col">
            {!selectedUser ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a conversation to start messaging
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center overflow-hidden">
                        {selectedUser.avatar_url ? (
                          <img 
                            src={selectedUser.avatar_url} 
                            alt={selectedUser.full_name || selectedUser.username} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-sm font-bold text-white">
                            {selectedUser.full_name?.charAt(0) || selectedUser.username?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      {/* Online indicator */}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    </div>
                    <div>
                      <h3 
                        className="font-semibold text-foreground cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/profile/${selectedUser.user_id}`)}
                      >
                        {selectedUser.full_name || selectedUser.username}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedUser.university}
                      </p>
                      <p className="text-xs text-green-600">Online</p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleClearChat}>
                        <MessageSquareX className="w-4 h-4 mr-2" />
                        Clear Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDeleteChat}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBlockUser} className="text-destructive">
                        <UserX className="w-4 h-4 mr-2" />
                        Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Messages area */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 p-4 overflow-y-auto space-y-1"
                >
                  {currentMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          No messages yet
                        </h3>
                        <p className="text-muted-foreground">
                          Start the conversation with {selectedUser.full_name || selectedUser.username}!
                        </p>
                      </div>
                    </div>
                  ) : (
                    currentMessages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.sender_id === user?.id}
                        replyToMessage={
                          message.reply_to_message_id 
                            ? currentMessages.find(m => m.id === message.reply_to_message_id)
                            : undefined
                        }
                        onReact={addReaction}
                        onRemoveReaction={removeReaction}
                        onReply={handleReply}
                      />
                    ))
                  )}
                  
                  {/* Typing indicator */}
                  {getTypingUserNames().length > 0 && (
                    <TypingIndicator userNames={getTypingUserNames()} />
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <MessageInput
                  onSendMessage={handleSendMessage}
                  onTyping={handleTyping}
                  replyToMessage={replyToMessage || undefined}
                  onCancelReply={handleCancelReply}
                />
              </>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Mobile layout
  return (
    <MobileLayout>
      {showUserList ? (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Messages</h2>
            <UserSearch onStartChat={handleUserClick} />
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {!loading && conversations.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">
                No conversations yet. Start one by searching for users above!
              </p>
            )}
            
            {!loading && conversations.map((conversation) => (
              <ConversationItem
                key={conversation.conversation_id}
                conversation={conversation}
                isSelected={false}
                onClick={() => handleConversationClick(conversation)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Mobile chat header */}
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUserList(true)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            {selectedUser && (
              <>
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center overflow-hidden">
                    {selectedUser.avatar_url ? (
                      <img 
                        src={selectedUser.avatar_url} 
                        alt={selectedUser.full_name || selectedUser.username} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-xs font-bold text-white">
                        {selectedUser.full_name?.charAt(0) || selectedUser.username?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {selectedUser.full_name || selectedUser.username}
                  </h3>
                  <p className="text-xs text-green-600">Online</p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleClearChat}>
                      <MessageSquareX className="w-4 h-4 mr-2" />
                      Clear Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDeleteChat}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBlockUser} className="text-destructive">
                      <UserX className="w-4 h-4 mr-2" />
                      Block User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* Messages area */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-4 overflow-y-auto space-y-1"
          >
            {currentMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No messages yet
                  </h3>
                  <p className="text-muted-foreground">
                    Start the conversation!
                  </p>
                </div>
              </div>
            ) : (
              currentMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === user?.id}
                  replyToMessage={
                    message.reply_to_message_id 
                      ? currentMessages.find(m => m.id === message.reply_to_message_id)
                      : undefined
                  }
                  onReact={addReaction}
                  onRemoveReaction={removeReaction}
                  onReply={handleReply}
                />
              ))
            )}
            
            {/* Typing indicator */}
            {getTypingUserNames().length > 0 && (
              <TypingIndicator userNames={getTypingUserNames()} />
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <MessageInput
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            replyToMessage={replyToMessage || undefined}
            onCancelReply={handleCancelReply}
          />
        </div>
      )}
    </MobileLayout>
  );
}