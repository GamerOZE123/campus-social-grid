import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import EditPostModal from './EditPostModal';
import ClickablePostCard from './ClickablePostCard';
import MultipleImageDisplay from './MultipleImageDisplay';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLikes } from '@/hooks/useLikes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Post {
  id: string;
  content: string;
  image_url?: string;
  image_urls?: string[];
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
    // Don't call onPostUpdated here to prevent page refresh
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
        <div className="w-full p-4 space-y-3 hover:bg-muted/20 transition-colors border-b border-border">
          {/* Header (with caption inside) */}
          <PostHeader
            username={username}
            fullName={fullName}
            avatarUrl={avatarUrl}
            createdAt={post.created_at}
            content={post.content}
            isOwnPost={isOwnPost}
            onEdit={() => setShowEditModal(true)}
            onDelete={handleDeletePost}
            userId={post.user_id}
          />

          {/* Images (single or multiple) */}
          {(post.image_urls?.length > 0 || post.image_url) && (
            <div className="ml-14">
              {post.image_urls?.length > 0 ? (
                <MultipleImageDisplay imageUrls={post.image_urls} />
              ) : post.image_url ? (
                <PostContent
                  content=""
                  imageUrl={post.image_url}
                />
              ) : null}
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.hashtags.map((hashtag, index) => (
                <button
                  key={index}
                  onClick={(e) => handleHashtagClick(hashtag, e)}
                  className="text-blue-500 hover:text-blue-700 hover:underline text-sm font-medium cursor-pointer transition-colors"
                >
                  #{hashtag}
                </button>
              ))}
            </div>
          )}

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
        </div>
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
