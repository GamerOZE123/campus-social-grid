import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import CommentsSection from './CommentsSection';
import EditPostModal from './EditPostModal';
import ClickablePostCard from './ClickablePostCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLikes } from '@/hooks/useLikes';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const { isLiked, likesCount, loading: likesLoading, toggleLike } = useLikes(post.id);

  const handleHashtagClick = (hashtag: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/hashtag/${hashtag}`);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike();
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/post/${post.id}`);
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id);

      if (error) {
        console.error('Error deleting post:', error);
        throw error;
      }

      toast.success('Post deleted successfully!');
      onPostUpdated?.();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  // Extract user info
  const username = post.profiles?.username || post.user_username || 'user';
  const fullName = post.profiles?.full_name || post.user_name || 'Anonymous User';
  const avatarUrl = post.profiles?.avatar_url;
  const isOwnPost = user?.id === post.user_id;

  return (
    <>
      <ClickablePostCard postId={post.id}>
        <Card className="w-full bg-card border border-border hover:shadow-md transition-shadow">
          <div className="p-4 space-y-3">
            {/* Header (without caption) */}
            <PostHeader
              username={username}
              fullName={fullName}
              avatarUrl={avatarUrl}
              createdAt={post.created_at}
              content=""
              isOwnPost={isOwnPost}
              onEdit={() => setShowEditModal(true)}
              onDelete={handleDeletePost}
            />

            {/* Content with caption and hashtags */}
            <PostContent
              content={post.content}
              imageUrl={post.image_url}
              hashtags={post.hashtags}
              onHashtagClick={handleHashtagClick}
            />

            {/* Actions */}
            <PostActions
              likesCount={likesCount}
              commentsCount={post.comments_count}
              isLiked={isLiked}
              likesLoading={likesLoading}
              onLike={handleLikeClick}
              onComment={handleCommentClick}
              onShare={onShare}
              postId={post.id}
              postContent={post.content}
            />
            {/* Comments Section */}
            <CommentsSection postId={post.id} commentsCount={post.comments_count} />
          </div>
        </Card>
      </ClickablePostCard>

      {/* Edit Post Modal */}
      {showEditModal && (
        <EditPostModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onPostUpdated={() => {
            onPostUpdated?.();
            setShowEditModal(false);
          }}
          post={{
            id: post.id,
            content: post.content,
            hashtags: post.hashtags,
          }}
        />
      )}
    </>
  );
}
