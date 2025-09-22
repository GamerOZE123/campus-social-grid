import React, { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/contexts/AuthContext';
import CommentItem from './CommentItem';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, MessageCircle, Send } from 'lucide-react';
import { Trash2 } from 'lucide-react'; // Import the delete icon

interface InlineCommentSectionProps {
  postId: string;
  initialCommentsCount?: number;
}

export default function InlineCommentSection({ postId, initialCommentsCount = 0 }: InlineCommentSectionProps) {
  const { user } = useAuth();
  const { comments, loading, submitting, addComment, deleteComment, commentsCount } = useComments(postId);
  const [newComment, setNewComment] = useState('');
  const [loadedCount, setLoadedCount] = useState(5); // Initially show 5 comments

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    const success = await addComment(newComment);
    if (success) {
      setNewComment('');
    }
  };

  const handleLoadMore = () => {
    setLoadedCount(prev => Math.min(prev + 5, comments.length));
  };

  const displayedComments = comments.slice(0, loadedCount);
  const hasMoreComments = loadedCount < comments.length;

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
      {/* Add Comment Form - Fixed at the top */}
      {user && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-border bg-background sticky top-0 z-10 flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 relative">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[40px] resize-none border-muted bg-background pr-10"
              disabled={submitting}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newComment.trim() || submitting}
              className="absolute right-1 bottom-1 h-8 w-8"
              aria-label="Send comment"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Comments List with Scrolling */}
      <div className="max-h-[400px] overflow-y-auto">
        <div className="p-4 space-y-3">
          {comments.length > 0 ? (
            <>
              {displayedComments.map((comment) => (
                <div key={comment.id} className="relative group">
                  <CommentItem
                    comment={comment}
                  />
                  {/* Delete button positioned to the right */}
                  {user && user.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteComment(comment.id)}
                      className="absolute top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              
              {hasMoreComments && (
                <div className="pt-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    className="w-full justify-center text-muted-foreground hover:text-foreground"
                  >
                    Load {Math.min(5, comments.length - loadedCount)} more comments
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}