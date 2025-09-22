import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url?: string;
  } | null;
}

interface CommentItemProps {
  comment: Comment;
}

export default function CommentItem({ comment }: CommentItemProps) {

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'just now';
    }
  };

  return (
    <div className="flex gap-3 group animate-fade-in">
      <Avatar className="w-8 h-8">
        <AvatarImage src={comment.profiles?.avatar_url || ''} />
        <AvatarFallback>
          {comment.profiles?.full_name?.[0] || comment.profiles?.username?.[0] || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="bg-muted/30 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {comment.profiles?.full_name || comment.profiles?.username || 'Anonymous'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(comment.created_at)}
            </span>
          </div>
          
          <p className="text-sm leading-relaxed break-words">
            {comment.content}
          </p>
        </div>
      </div>
    </div>
  );
}