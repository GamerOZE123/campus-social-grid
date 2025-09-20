import React, { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Reply, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface MessageReaction {
  id: string;
  user_id: string;
  reaction_type: 'heart' | 'like' | 'laugh' | 'wow' | 'sad' | 'angry';
  created_at: string;
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

interface MessageBubbleProps {
  message: EnhancedMessage;
  isOwn: boolean;
  replyToMessage?: EnhancedMessage;
  onReact: (messageId: string, reactionType: string) => void;
  onRemoveReaction: (messageId: string, reactionType: string) => void;
  onReply: (message: EnhancedMessage) => void;
  showAvatar?: boolean;
  avatarUrl?: string;
  senderName?: string;
}

const reactionEmojis = {
  heart: '❤️',
  like: '👍',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😠'
};

export default function MessageBubble({
  message,
  isOwn,
  replyToMessage,
  onReact,
  onRemoveReaction,
  onReply,
  showAvatar = false,
  avatarUrl,
  senderName
}: MessageBubbleProps) {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);

  const handleReaction = (reactionType: string) => {
    if (!user) return;
    
    const existingReaction = message.reactions?.find(
      r => r.user_id === user.id && r.reaction_type === reactionType
    );
    
    if (existingReaction) {
      onRemoveReaction(message.id, reactionType);
    } else {
      onReact(message.id, reactionType);
    }
    setShowReactions(false);
  };

  const getReactionCounts = () => {
    const counts: { [key: string]: number } = {};
    message.reactions?.forEach(reaction => {
      counts[reaction.reaction_type] = (counts[reaction.reaction_type] || 0) + 1;
    });
    return counts;
  };

  const getUserReactions = () => {
    if (!user) return new Set();
    return new Set(
      message.reactions
        ?.filter(r => r.user_id === user.id)
        .map(r => r.reaction_type) || []
    );
  };

  const renderStatus = () => {
    if (!isOwn || !message.status) return null;
    
    switch (message.status) {
      case 'sent':
        return <Check className="w-3 h-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-primary" />;
      default:
        return null;
    }
  };

  const reactionCounts = getReactionCounts();
  const userReactions = getUserReactions();

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[70%]`}>
        {/* Avatar for group chats */}
        {showAvatar && !isOwn && (
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={senderName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-white">
                {senderName?.charAt(0) || 'U'}
              </span>
            )}
          </div>
        )}

        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name for group chats */}
          {showAvatar && !isOwn && senderName && (
            <span className="text-xs text-muted-foreground mb-1 px-2">{senderName}</span>
          )}

          {/* Reply context */}
          {replyToMessage && (
            <div className={`mb-2 p-2 rounded-lg border-l-2 border-primary/50 bg-muted/30 text-xs ${
              isOwn ? 'mr-2' : 'ml-2'
            }`}>
              <p className="text-muted-foreground font-medium">Replying to:</p>
              <p className="text-foreground/70 truncate max-w-[200px]">{replyToMessage.content}</p>
            </div>
          )}

          {/* Message bubble */}
          <div className="relative">
            <div
              className={`px-4 py-2 rounded-2xl relative ${
                isOwn 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-foreground'
              }`}
            >
              {/* Media content */}
              {message.media_url && (
                <div className="mb-2">
                  {message.media_type?.startsWith('image/') ? (
                    <img 
                      src={message.media_url} 
                      alt="Shared image" 
                      className="max-w-full rounded-lg"
                    />
                  ) : (
                    <div className="p-2 bg-background/10 rounded-lg">
                      <p className="text-sm">📎 File attachment</p>
                    </div>
                  )}
                </div>
              )}

              {/* Text content */}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {/* Message actions (visible on hover) */}
              <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${
                isOwn ? '-left-20' : '-right-20'
              }`}>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 bg-background/80 hover:bg-background"
                    onClick={() => setShowReactions(!showReactions)}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 bg-background/80 hover:bg-background"
                    onClick={() => onReply(message)}
                  >
                    <Reply className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick reactions */}
            {showReactions && (
              <div className={`absolute top-full mt-1 ${isOwn ? 'right-0' : 'left-0'} z-10`}>
                <div className="bg-background border border-border rounded-full p-2 shadow-lg flex gap-1">
                  {Object.entries(reactionEmojis).map(([type, emoji]) => (
                    <button
                      key={type}
                      onClick={() => handleReaction(type)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors ${
                        userReactions.has(type) ? 'bg-primary/20' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reactions display */}
            {Object.keys(reactionCounts).length > 0 && (
              <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {Object.entries(reactionCounts).map(([type, count]) => (
                  <button
                    key={type}
                    onClick={() => handleReaction(type)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-background/80 border hover:bg-muted transition-colors ${
                      userReactions.has(type) ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                  >
                    <span>{reactionEmojis[type as keyof typeof reactionEmojis]}</span>
                    <span className="text-xs">{count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timestamp and status */}
          <div className={`flex items-center gap-1 mt-1 px-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
            {renderStatus()}
          </div>
        </div>
      </div>
    </div>
  );
}