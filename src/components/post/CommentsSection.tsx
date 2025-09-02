import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useComments } from '@/hooks/useComments';
import { Trash2, MessageSquare } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CommentsSectionProps {
  postId: string;
  commentsCount: number;
}

export default function CommentsSection({ postId, commentsCount }: CommentsSectionProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { 
    comments, 
    loading, 
    submitting, 
    addComment, 
    deleteComment 
  } = useComments(postId);

  const handleAddComment = async () => {
    if (!newComment.trim() || submitting) return;
    
    const success = await addComment(newComment);
    if (success) {
      setNewComment('');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !submitting) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-muted-foreground hover:text-foreground p-0 h-auto"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {commentsCount > 0 ? `View ${commentsCount} comments` : 'Add a comment'}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 mt-4">
        {/* Add Comment */}
        {user && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-muted/50 border-muted"
                disabled={submitting}
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submitting}
                size="sm"
              >
                {submitting ? 'Adding...' : 'Comment'}
              </Button>
            </div>
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">
                    {comment.profiles?.full_name?.charAt(0) || comment.profiles?.username?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {comment.profiles?.full_name || comment.profiles?.username || 'Anonymous User'}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {user && user.id === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}