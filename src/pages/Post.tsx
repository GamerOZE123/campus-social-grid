import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import PostCard from '@/components/post/PostCard';
import NewCommentSection from '@/components/post/NewCommentSection';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MobileHeader from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';

interface PostData {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: {
    full_name?: string;
    username?: string;
    university?: string;
    major?: string;
    avatar_url?: string;
  } | null;
}

interface TransformedPost {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  user_name: string;
  user_username: string;
  user_university?: string;
}

export default function Post() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<TransformedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      console.log('Fetching post:', postId);
      
      // Fetch the specific post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (postError) {
        console.error('Error fetching post:', postError);
        throw postError;
      }
      
      if (!postData) {
        setError('Post not found');
        return;
      }
      
      console.log('Fetched post:', postData);
      
      // Fetch the user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, university, major, avatar_url')
        .eq('user_id', postData.user_id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      
      console.log('Fetched profile:', profileData);
      
      // Transform the post data
      const userName = profileData?.full_name || profileData?.username || 'Anonymous User';
      const userUsername = profileData?.username || 'user';
      const userUniversity = profileData?.university || 'University';
      
      const transformedPost: TransformedPost = {
        id: postData.id,
        content: postData.content || '',
        image_url: postData.image_url,
        created_at: postData.created_at,
        likes_count: postData.likes_count || 0,
        comments_count: postData.comments_count || 0,
        user_id: postData.user_id,
        user_name: userName,
        user_username: userUsername,
        user_university: userUniversity
      };
      
      setPost(transformedPost);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error || 'Post not found'}</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Go Home
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {isMobile && <MobileHeader />}
      <div
        className="max-w-2xl mx-auto"
        style={{ paddingRight: '10px', paddingLeft: '10px' }} // <-- added inline style
      >
        <PostCard post={post} />
        <NewCommentSection postId={post.id} />
      </div>
    </Layout>
  );
}
