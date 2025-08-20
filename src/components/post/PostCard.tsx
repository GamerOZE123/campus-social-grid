
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import EditPostModal from './EditPostModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Post {
  id: string;
  content: string;
  image_url?: string;
  hashtags?: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_id?: string;
  user_name?: string;
  user_username?: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onPostUpdated?: () => void;
}

export default function PostCard({ post, onLike, onComment, onShare, onPostUpdated }: PostCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleHashtagClick = (hashtag: string) => {
    navigate(`/hashtag/${hashtag}`);
  };

  const handleDeletePost = async () => {
    if (!user || post.user_id !== user.id) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      toast.success('Post deleted successfully!');
      if (onPostUpdated) onPostUpdated();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  // Extract user info from either profiles object or direct properties
  const username = post.profiles?.username || post.user_username || 'user';
  const fullName = post.profiles?.full_name || post.user_name || 'Anonymous User';
  const avatarUrl = post.profiles?.avatar_url;

  const isOwner = user && post.user_id === user.id;

  console.log('PostCard - post hashtags:', post.hashtags);

  return (
    <>
      <Card className="w-full bg-card border border-border hover:shadow-md transition-shadow">
        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <PostHeader 
              username={username}
              fullName={fullName}
              avatarUrl={avatarUrl}
              createdAt={post.created_at}
            />
            
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDeletePost}
                    disabled={isDeleting}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <PostContent 
            content={post.content}
            imageUrl={post.image_url}
          />
          
          {/* Display hashtags below the content */}
          {post.hashtags && Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.hashtags.map((hashtag, index) => (
                <button
                  key={index}
                  onClick={() => handleHashtagClick(hashtag)}
                  className="text-blue-500 hover:text-blue-700 hover:underline text-sm font-medium cursor-pointer transition-colors"
                >
                  #{hashtag}
                </button>
              ))}
            </div>
          )}
          
          <PostActions 
            likesCount={post.likes_count}
            commentsCount={post.comments_count}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            postId={post.id}
            postContent={post.content}
          />
        </div>
      </Card>

      {isEditModalOpen && (
        <EditPostModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onPostUpdated={() => {
            if (onPostUpdated) onPostUpdated();
          }}
          post={post}
        />
      )}
    </>
  );
}
