
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/layout/MobileLayout';
import CreatePost from '@/components/post/CreatePost';
import PostCard from '@/components/post/PostCard';
import RightSidebar from '@/components/layout/RightSidebar';
import HomepageBanner from '@/components/advertising/HomepageBanner';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/hooks/usePosts';
import { useIsMobile } from '@/hooks/use-mobile';


interface PostData {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  image_urls?: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  hashtags?: string[];
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
  image_urls?: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  user_id: string;
  user_name: string;
  user_username: string;
  user_university?: string;
  hashtags?: string[];
  profiles?: {
    full_name: string;
    username: string;
    avatar_url?: string;
  };
}

interface AdvertisingPost {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  redirect_url: string;
  click_count: number;
  likes_count: number;
  views_count: number;
  created_at: string;
  company_id: string;
  company_profiles?: {
    company_name: string;
    logo_url?: string;
  };
}

interface MixedPost {
  type: 'regular' | 'advertising';
  data: TransformedPost | AdvertisingPost;
}

export default function Home() {
  const { user } = useAuth();
  const { posts, loading, refetch } = usePosts();
  const isMobile = useIsMobile();
  const [refreshing, setRefreshing] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderContent = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      {showBanner && (
        <HomepageBanner 
          onClose={() => setShowBanner(false)}
          className="mb-6"
        />
      )}
      
      <CreatePost onPostCreated={refetch} />
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))
      )}
    </div>
  );

  if (isMobile) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-6">
          {renderContent()}
        </div>
      </MobileLayout>
    );
  }

  return (
    <Layout>
      <div className="flex gap-6">
        <div className="flex-1">
          {renderContent()}
        </div>
        <RightSidebar />
      </div>
    </Layout>
  );
}
