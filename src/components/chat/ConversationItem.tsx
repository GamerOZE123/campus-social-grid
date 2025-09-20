import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Circle } from 'lucide-react';

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

interface ConversationItemProps {
  conversation: EnhancedConversation;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export default function ConversationItem({ 
  conversation, 
  isSelected, 
  onClick, 
  className = '' 
}: ConversationItemProps) {
  const {
    other_user_name,
    other_user_avatar,
    other_user_university,
    last_message,
    last_message_time,
    unread_count,
    is_other_user_online,
    last_seen,
    is_typing
  } = conversation;

  const getLastSeenText = () => {
    if (is_other_user_online) return 'Online';
    if (!last_seen) return 'Offline';
    
    try {
      return `Last seen ${formatDistanceToNow(new Date(last_seen), { addSuffix: true })}`;
    } catch {
      return 'Offline';
    }
  };

  const formatMessageTime = (timeString: string) => {
    if (!timeString) return '';
    
    try {
      const messageDate = new Date(timeString);
      const now = new Date();
      const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return messageDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      } else if (diffInHours < 168) { // 7 days
        return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return messageDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 ${
        isSelected ? 'bg-primary/10 border border-primary/20' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* Avatar with online indicator */}
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center overflow-hidden">
          {other_user_avatar ? (
            <img 
              src={other_user_avatar} 
              alt={other_user_name} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="text-sm font-bold text-white">
              {other_user_name?.charAt(0) || 'U'}
            </span>
          )}
        </div>
        
        {/* Online status indicator */}
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
          is_other_user_online ? 'bg-green-500' : 'bg-gray-400'
        }`} />
      </div>

      {/* User info and message preview */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-medium truncate ${
            unread_count > 0 ? 'text-foreground' : 'text-foreground/90'
          }`}>
            {other_user_name}
          </h3>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {last_message_time && (
              <span className={`text-xs ${
                unread_count > 0 ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}>
                {formatMessageTime(last_message_time)}
              </span>
            )}
            
            {unread_count > 0 && (
              <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">
                  {unread_count > 99 ? '99+' : unread_count}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* University */}
        {other_user_university && (
          <p className="text-xs text-muted-foreground truncate mb-1">
            {other_user_university}
          </p>
        )}

        {/* Last message or typing indicator */}
        <div className="flex items-center justify-between">
          <p className={`text-sm truncate flex-1 ${
            unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
          }`}>
            {is_typing ? (
              <span className="italic text-primary flex items-center gap-1">
                <span className="flex gap-1">
                  <Circle className="w-1 h-1 fill-current animate-pulse" />
                  <Circle className="w-1 h-1 fill-current animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <Circle className="w-1 h-1 fill-current animate-pulse" style={{ animationDelay: '0.4s' }} />
                </span>
                typing...
              </span>
            ) : (
              last_message || 'No messages yet'
            )}
          </p>
        </div>

        {/* Online status text */}
        <p className="text-xs text-muted-foreground mt-1">
          {getLastSeenText()}
        </p>
      </div>
    </div>
  );
}