import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface NewCommentSectionProps {
  postId: string;
}

export default function NewCommentSection({ postId }: NewCommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    if (!postId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Transform the data to handle profiles properly
      const transformedComments = (data || []).map(comment => ({
        ...comment,
        profiles: Array.isArray(comment.profiles) ? comment.profiles[0] || null : comment.profiles
      }));
      
      setComments(transformedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || submitting) return;
    
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          post_id: postId,
          user_id: user.id
        })
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (
            full_name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Transform the data to handle profiles properly
      const transformedComment = {
        ...data,
        profiles: Array.isArray(data.profiles) ? data.profiles[0] || null : data.profiles
      };

      setComments(prev => [...prev, transformedComment]);
      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  if (loading) {
    return (
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="text-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4 border-t border-border">
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
              className="flex-1 bg-muted/50 border-muted"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !submitting) {
                  handleAddComment();
                }
              }}
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
                    disabled={submitting}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-foreground">{comment.content}</p>
            </div>
          </div>
        ))}
        
        {comments.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}