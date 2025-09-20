import React, { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/contexts/AuthContext';
import CommentItem from './CommentItem';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, MessageCircle } from 'lucide-react';

interface InlineCommentSectionProps {
  postId: string;
  initialCommentsCount?: number;
}

export default function InlineCommentSection({ postId, initialCommentsCount = 0 }: InlineCommentSectionProps) {
  const { user } = useAuth();
  const { comments, loading, submitting, addComment, deleteComment, commentsCount } = useComments(postId);
  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    const success = await addComment(newComment);
    if (success) {
      setNewComment('');
    }
  };

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);
  const hasMoreComments = comments.length > 3;

  if (loading) {
    return (
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-muted/5 animate-accordion-down">
      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="p-4 space-y-3">
          {displayedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={deleteComment}
              currentUserId={user?.id}
            />
          ))}
          
          {hasMoreComments && !showAllComments && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllComments(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              View {comments.length - 3} more comments
            </Button>
          )}
        </div>
      ) : (
        <div className="p-4 text-center text-muted-foreground">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet. Be the first to comment!</p>
        </div>
      )}

      {/* Add Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-border">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[60px] resize-none border-muted bg-background"
                disabled={submitting}
              />
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newComment.trim() || submitting}
                  className="min-w-[80px]"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Comment'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}