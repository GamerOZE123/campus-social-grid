import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/layout/MobileLayout';
import UserSearch from '@/components/chat/UserSearch';
import MobileChatHeader from '@/components/chat/MobileChatHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Send, MoreVertical, Trash2, MessageSquareX, UserX, Loader2 } from 'lucide-react';
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
  const [unreadMessages, setUnreadMessages] = useState<Set<string>>(new Set());
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageNotification, setNewMessageNotification] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null); // For confirmation dialog
  const [selectedChatsForBulk, setSelectedChatsForBulk] = useState<Set<string>>(new Set()); // For bulk delete
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessagesLength = useRef(0);
  const {
    conversations,
    currentMessages,
    loading: chatLoading,
    fetchMessages,
    loadOlderMessages,
    sendMessage,
    createConversation,
    clearChat,
    deleteChat,
    refreshConversations,
  } = useChat();
  const { recentChats, loading, addRecentChat, refreshRecentChats } = useRecentChats(); // Added loading
  const { getUserById } = useUsers();

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (currentMessages.length > previousMessagesLength.current) {
      if (isAtBottom) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        setNewMessageNotification(true);
      }
    }
    previousMessagesLength.current = currentMessages.length;
  }, [currentMessages, isAtBottom]);

  useEffect(() => {
    if (selectedConversationId && currentMessages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        setIsAtBottom(true);
      }, 50);
    }
  }, [selectedConversationId]);

  // Realtime: move chats to top + unread badge
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('chat-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const message = payload.new;
          if (message.sender_id !== user.id) {
            const chatUserId = message.sender_id;
            // Move chat to top and add to recentChats (handled by useRecentChats.ts)
            // Add unread badge
            if (selectedUser?.user_id !== chatUserId) {
              setUnreadMessages((prev) => new Set(prev).add(chatUserId));
            }
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUser]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    const atTop = scrollTop <= 10;
    setIsAtBottom(atBottom);
    if (atBottom) setNewMessageNotification(false);
    if (atTop && selectedConversationId && currentMessages.length >= 20) {
      const prevHeight = scrollHeight;
      loadOlderMessages(selectedConversationId).then(() => {
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const newHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newHeight - prevHeight;
          }
        }, 50);
      });
    }
  };

  useEffect(() => {
    if (selectedConversationId) fetchMessages(selectedConversationId);
  }, [selectedConversationId]);

  const handleUserClick = async (userId: string) => {
  try {
    const userProfile = await getUserById(userId);
    if (!userProfile) {
      console.error('Failed to fetch user profile:', userId);
      toast.error('Failed to load user profile');
      return;
    }
    console.log('Selected user:', userProfile);
    setSelectedUser(userProfile);
    const conversationId = await createConversation(userId);
    if (!conversationId) {
      console.error('Failed to create conversation for user:', userId);
      toast.error('Failed to create conversation');
      return;
    }
    setSelectedConversationId(conversationId);
    setNewMessageNotification(false);
    setUnreadMessages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
    console.log('Attempting to add recent chat for user:', userId);
    await addRecentChat(userId); // This should now work
    console.log('Successfully added to recent chats:', userId);
    if (isMobile) setShowUserList(false);
  } catch (error) {
    console.error('Error in handleUserClick:', JSON.stringify(error, null, 2));
    toast.error('An error occurred while starting the chat');
  }
};
  const handleBackToUserList = () => {
    setShowUserList(true);
    setSelectedConversationId(null);
    setSelectedUser(null);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;
    const msg = newMessage.trim();
    setNewMessage('');
    const result = await sendMessage(selectedConversationId, msg);
    if (result.success && selectedUser?.user_id) {
      await addRecentChat(selectedUser.user_id);
    } else {
      toast.error('Failed to send message');
    }
  };

  const handleClearChat = async () => {
    if (!selectedConversationId || !user) return;
    const result = await clearChat(selectedConversationId);
    if (result.success) toast.success('Chat cleared');
    else toast.error('Failed to clear chat');
  };

  const handleDeleteChat = async (conversationId?: string, otherUserId?: string) => {
    if (conversationId && otherUserId) {
      // Single delete: Show confirmation
      setDeletingChatId(conversationId);
      return;
    }

    // Bulk delete
    if (selectedChatsForBulk.size === 0) {
      toast.error('No chats selected for deletion');
      return;
    }

    let successCount = 0;
    for (const otherUserId of selectedChatsForBulk) {
      const conv = conversations.find((c) => c.other_user_id === otherUserId);
      if (conv) {
        const result = await deleteChat(conv.conversation_id, otherUserId);
        if (result.success) successCount++;
        else console.error('Failed to delete chat:', otherUserId, result.error);
      }
    }

    if (successCount > 0) {
      toast.success(`Deleted ${successCount} chat${successCount > 1 ? 's' : ''} for you`);
      setSelectedChatsForBulk(new Set());
      setSelectedConversationId(null);
      setSelectedUser(null);
      refreshConversations();
      refreshRecentChats();
    } else {
      toast.error('Failed to delete chats');
    }
  };

  const confirmDelete = async () => {
    if (!deletingChatId || !selectedUser?.user_id) {
      console.error('Missing conversationId or userId:', { deletingChatId, userId: selectedUser?.user_id });
      toast.error('Cannot delete chat: Missing details');
      setDeletingChatId(null);
      return;
    }
    console.log('Confirming delete:', { conversationId: deletingChatId, otherUserId: selectedUser.user_id });
    const result = await deleteChat(deletingChatId, selectedUser.user_id);
    console.log('Delete result:', result);
    setDeletingChatId(null);
    if (result.success) {
      toast.success('Chat deleted for you');
      setSelectedConversationId(null);
      setSelectedUser(null);
      refreshConversations();
      refreshRecentChats();
    } else {
      toast.error('Failed to delete chat: ' + result.error);
    }
  };

  const toggleBulkSelect = (otherUserId: string) => {
    const newSet = new Set(selectedChatsForBulk);
    if (newSet.has(otherUserId)) {
      newSet.delete(otherUserId);
    } else {
      newSet.add(otherUserId);
    }
    setSelectedChatsForBulk(newSet);
  };

  const handleBlockUser = async () => {
    if (!selectedUser?.user_id || !user) return;
    const { error } = await supabase.from('blocked_users').insert({
      blocker_id: user.id,
      blocked_id: selectedUser.user_id,
    });
    if (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
      return;
    }
    toast.success('User blocked');
    setSelectedConversationId(null);
    setSelectedUser(null);
  };

  // --- UI (Desktop) ---
  if (!isMobile) {
    return (
      <Layout>
        <div className="h-[calc(100vh-6rem)] flex gap-4 pt-2">
          {/* Left column - user list */}
          <div className="w-1/3 bg-card border border-border rounded-2xl p-4 overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">Messages</h2>
            <UserSearch onStartChat={handleUserClick} />
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground flex justify-between items-center">
                Recent Chats
                {selectedChatsForBulk.size > 0 && (
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteChat()}>
                    Delete Selected ({selectedChatsForBulk.size})
                  </Button>
                )}
              </h3>
              {loading && (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && recentChats.length === 0 && (
                <p className="text-muted-foreground text-sm">No recent chats. Start one!</p>
              )}
              {!loading &&
                recentChats.map((chat) => (
                  <div
                    key={chat.other_user_id}
                    className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors relative ${
                      selectedChatsForBulk.has(chat.other_user_id) ? 'bg-destructive/10' : ''
                    }`}
                    onClick={() => handleUserClick(chat.other_user_id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      toggleBulkSelect(chat.other_user_id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedChatsForBulk.has(chat.other_user_id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleBulkSelect(chat.other_user_id);
                      }}
                      className="mr-2"
                    />
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
                    {selectedChatsForBulk.size === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const conv = conversations.find((c) => c.other_user_id === chat.other_user_id);
                          if (conv) handleDeleteChat(conv.conversation_id, chat.other_user_id);
                          else toast.error('Conversation not found');
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </div>
          {/* Right column - chat */}
          <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col h-full">
            {chatLoading && (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!chatLoading && selectedUser ? (
              <>
                {/* Chat header */}
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
                        onClick={() => navigate(`/profile/${selectedUser.user_id}`)}
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
                      <DropdownMenuItem onClick={() => handleDeleteChat(selectedConversationId!, selectedUser.user_id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBlockUser} className="text-destructive">
                        <UserX className="w-4 h-4 mr-2" /> Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* Chat messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 p-4 overflow-y-auto space-y-4 relative"
                >
                  {currentMessages.length ? (
                    currentMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            message.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}
                          >
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
                  {newMessageNotification && (
                    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-10">
                      <Button
                        onClick={() => {
                          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                          setNewMessageNotification(false);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                        size="sm"
                      >
                        New message ↓
                      </Button>
                    </div>
                  )}
                </div>
                {/* Input */}
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
            {/* Confirmation Dialog (Instagram-style) */}
            {deletingChatId && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-card p-6 rounded-lg max-w-sm w-full mx-4">
                  <h3 className="text-lg font-semibold mb-2">Delete Chat?</h3>
                  <p className="text-muted-foreground mb-4">
                    This will remove the chat from your inbox only. The other person will still have it.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDeletingChatId(null)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={confirmDelete}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // --- Mobile UI ---
  return (
    <>
      {showUserList ? (
        <MobileLayout showHeader={true} showNavigation={true}>
          <div className="p-4">
            <UserSearch onStartChat={handleUserClick} />
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground flex justify-between items-center">
                Recent Chats
                {selectedChatsForBulk.size > 0 && (
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteChat()}>
                    Delete Selected ({selectedChatsForBulk.size})
                  </Button>
                )}
              </h3>
              {loading && (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && recentChats.length === 0 && (
                <p className="text-muted-foreground text-sm">No recent chats. Start one!</p>
              )}
              {!loading &&
                recentChats.map((chat) => (
                  <div
                    key={chat.other_user_id}
                    className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors relative ${
                      selectedChatsForBulk.has(chat.other_user_id) ? 'bg-destructive/10' : ''
                    }`}
                    onClick={() => handleUserClick(chat.other_user_id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      toggleBulkSelect(chat.other_user_id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedChatsForBulk.has(chat.other_user_id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleBulkSelect(chat.other_user_id);
                      }}
                      className="mr-2"
                    />
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
                    {selectedChatsForBulk.size === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const conv = conversations.find((c) => c.other_user_id === chat.other_user_id);
                          if (conv) handleDeleteChat(conv.conversation_id, chat.other_user_id);
                          else toast.error('Conversation not found');
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </MobileLayout>
      ) : (
        <div className="h-screen bg-background flex flex-col">
          <MobileChatHeader
            userName={selectedUser?.full_name || selectedUser?.username || 'Unknown User'}
            userUniversity={selectedUser?.university || 'University'}
            onBackClick={handleBackToUserList}
            onClearChat={handleClearChat}
            onDeleteChat={() => handleDeleteChat(selectedConversationId!, selectedUser.user_id)}
            onBlockUser={handleBlockUser}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 p-4 overflow-y-auto space-y-4 pb-safe relative"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {chatLoading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!chatLoading && currentMessages.length ? (
                currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${
                        message.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
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
              {newMessageNotification && (
                <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-10">
                  <Button
                    onClick={() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                      setNewMessageNotification(false);
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    size="sm"
                  >
                    New message ↓
                  </Button>
                </div>
              )}
            </div>
            <div className="border-t border-border p-4 bg-card/95 backdrop-blur-sm sticky bottom-0">
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
                  className="flex-1 resize-none max-h-32"
                  rows={1}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          {deletingChatId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card p-6 rounded-lg max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold mb-2">Delete Chat?</h3>
                <p className="text-muted-foreground mb-4">
                  This will remove the chat from your inbox only. The other person will still have it.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeletingChatId(null)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={confirmDelete}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
