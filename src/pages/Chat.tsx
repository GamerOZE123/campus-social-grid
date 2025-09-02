import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/layout/MobileLayout';
import UserSearch from '@/components/chat/UserSearch';
import MobileChatHeader from '@/components/chat/MobileChatHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Send, MoreVertical, Trash2, MessageSquareX, UserX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useRecentChats } from '@/hooks/useRecentChats';
import { useUsers } from '@/hooks/useUsers';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Chat() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showUserList, setShowUserList] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const previousMessagesLength = useRef(0);

  const { 
    conversations, 
    currentMessages, 
    loading: chatLoading,
    isChatCleared,
    fetchMessages,
    loadOlderMessages,
    sendMessage, 
    createConversation,
    clearChat,
    refreshConversations
  } = useChat();
  
  const { recentChats, addRecentChat, refreshRecentChats } = useRecentChats();
  const { getUserById } = useUsers();

  useEffect(() => {
    if (currentMessages && currentMessages.length > previousMessagesLength.current && !isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    previousMessagesLength.current = currentMessages?.length || 0;
  }, [currentMessages?.length, isUserScrolling]);

  useEffect(() => {
    if (selectedConversationId && currentMessages && currentMessages.length > 0) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [selectedConversationId, currentMessages]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      const isAtTop = scrollTop <= 10;
      
      if (isAtTop && selectedConversationId && currentMessages.length >= 15) {
        loadOlderMessages(selectedConversationId);
      }
      
      if (!isAtBottom) {
        setIsUserScrolling(true);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => setIsUserScrolling(false), 3000);
      } else {
        setIsUserScrolling(false);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      }
    }
  };

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
    }
  }, [selectedConversationId, fetchMessages]);

  const handleUserClick = async (userId: string) => {
    try {
      const userProfile = await getUserById(userId);
      if (userProfile) {
        setSelectedUser(userProfile);
        const conversationId = await createConversation(userId);
        setSelectedConversationId(conversationId);
        setUnreadMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        if (isMobile) setShowUserList(false);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;
    const messageToSend = newMessage.trim();
    setNewMessage('');
    try {
      await sendMessage(selectedConversationId, messageToSend);
      if (selectedUser?.user_id) await addRecentChat(selectedUser.user_id);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageToSend);
    }
  };

  const handleBackToUserList = () => {
    setShowUserList(true);
    setSelectedConversationId(null);
    setSelectedUser(null);
  };

  const handleUsernameClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleClearChat = async () => {
    if (!selectedConversationId || !user) return;
    try {
      const result = await clearChat(selectedConversationId);
      if (result.success) toast.success('Chat cleared successfully');
      else throw new Error(result.error || 'Failed to clear chat');
    } catch {
      toast.error('Failed to clear chat');
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedConversationId || !user) return;
    try {
      await supabase.from('deleted_chats').insert({
        user_id: user.id,
        conversation_id: selectedConversationId,
        reason: 'deleted'
      });
      toast.success('Chat deleted successfully');
      handleBackToUserList();
      refreshConversations();
      refreshRecentChats();
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  const handleBlockUser = async () => {
    if (!selectedUser?.user_id || !user) return;
    try {
      await supabase.from('blocked_users').insert({
        blocker_id: user.id,
        blocked_id: selectedUser.user_id
      });
      toast.success('User blocked successfully');
      handleBackToUserList();
    } catch {
      toast.error('Failed to block user');
    }
  };

  if (!isMobile) {
    return (
      <Layout>
        <div className="h-[calc(100vh-6rem)] flex gap-4 pt-2">
          <div className="w-1/3 bg-card border border-border rounded-2xl p-4 overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">Messages</h2>
            <UserSearch onStartChat={handleUserClick} />
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Recent Chats</h3>
              {recentChats.map((chat) => (
                <div
                  key={chat.other_user_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors relative"
                  onClick={() => handleUserClick(chat.other_user_id)}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center relative">
                    <span className="text-sm font-bold text-white">
                      {chat.other_user_name?.charAt(0) || 'U'}
                    </span>
                    {unreadMessages.has(chat.other_user_id) && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{chat.other_user_name}</p>
                    <p className="text-sm text-muted-foreground">{chat.other_user_university}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col h-full">
            {selectedUser ? (
              <>
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {selectedUser.full_name?.charAt(0) || selectedUser.username?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 
                        className="font-semibold text-foreground cursor-pointer hover:text-primary"
                        onClick={() => handleUsernameClick(selectedUser.user_id)}
                      >
                        {selectedUser.full_name || selectedUser.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">{selectedUser.university}</p>
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
                        <MessageSquareX className="w-4 h-4 mr-2" /> Clear Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDeleteChat}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBlockUser} className="text-destructive">
                        <UserX className="w-4 h-4 mr-2" /> Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 p-4 overflow-y-auto space-y-4"
                >
                  {currentMessages?.length ? (
                    currentMessages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          message.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${message.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <h3 className="text-lg font-medium text-foreground mb-2">No messages yet</h3>
                        <p className="text-muted-foreground">Start the conversation!</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-border p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 resize-none"
                      rows={1}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a user to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      {showUserList ? (
        <MobileLayout showHeader={false} showNavigation={true}>
          <div className="p-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Messages</h2>
            <UserSearch onStartChat={handleUserClick} />
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Recent Chats</h3>
              {recentChats.map((chat) => (
                <div
                  key={chat.other_user_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleUserClick(chat.other_user_id)}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center relative">
                    <span className="text-sm font-bold text-white">
                      {chat.other_user_name?.charAt(0) || 'U'}
                    </span>
                    {unreadMessages.has(chat.other_user_id) && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{chat.other_user_name}</p>
                    <p className="text-sm text-muted-foreground">{chat.other_user_university}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MobileLayout>
      ) : (
        <div className="min-h-screen bg-background flex flex-col">
          <MobileChatHeader
            userName={selectedUser?.full_name || selectedUser?.username || 'Unknown User'}
            userUniversity={selectedUser?.university || 'University'}
            onBackClick={handleBackToUserList}
            onClearChat={handleClearChat}
            onDeleteChat={handleDeleteChat}
            onBlockUser={handleBlockUser}
          />

          <div className="flex-1 flex flex-col">
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 p-4 overflow-y-auto space-y-4"
            >
              {currentMessages?.length ? (
                currentMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                      message.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No messages yet</h3>
                    <p className="text-muted-foreground">Start the conversation!</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border p-4 bg-card">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 resize-none"
                  rows={1}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
