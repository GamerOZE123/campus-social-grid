
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (content: string) => Promise<boolean>;
  onDeleteComment?: (commentId: string) => Promise<boolean>;
  submitting: boolean;
}

export default function CommentSection({ 
  comments, 
  onAddComment, 
  onDeleteComment,
  submitting 
}: CommentSectionProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        setUserProfile(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    const success = await onAddComment(newComment);
    if (success) {
      setNewComment('');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (onDeleteComment) {
      await onDeleteComment(commentId);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      {/* Add Comment */}
      {user && (
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url} alt="Your avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-white">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            )}
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
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {comment.profiles?.avatar_url ? (
                <img src={comment.profiles.avatar_url} alt={comment.profiles.full_name || comment.profiles.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white">
                  {comment.profiles?.full_name?.charAt(0) || comment.profiles?.username?.charAt(0) || 'U'}
                </span>
              )}
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
                {user && user.id === comment.user_id && onDeleteComment && (
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
    </div>
  );
}
