import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/layout/MobileLayout';
import { Plus, BarChart3, Eye, MousePointer, Heart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdvertisingPostCard from '@/components/advertising/AdvertisingPostCard';
import AdvertisingPostDetailModal from '@/components/advertising/AdvertisingPostDetailModal';
import CreateAdvertisingPostModal from '@/components/advertising/CreateAdvertisingPostModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Advertising() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [advertisingPosts, setAdvertisingPosts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalClicks: 0,
    totalLikes: 0,
    totalPosts: 0,
    ctr: 0 // Click-through rate
  });

  const fetchAdvertisingPosts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('advertising_posts')
        .select('*')
        .eq('is_active', true)
        .eq('company_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch company profile for the current user
      const { data: companyProfile } = await supabase
        .from('company_profiles')
        .select('user_id, company_name, logo_url')
        .eq('user_id', user.id)
        .single();
      
      // Map company profile to advertising posts
      const postsWithProfiles = (data || []).map(post => ({
        ...post,
        company_profiles: companyProfile || null
      }));
      
      const posts = postsWithProfiles;
      setAdvertisingPosts(postsWithProfiles);
      
      // Calculate analytics
      const totalViews = posts.reduce((sum, post) => sum + (post.views_count || 0), 0);
      const totalClicks = posts.reduce((sum, post) => sum + (post.click_count || 0), 0);
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const totalPosts = posts.length;
      const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100) : 0;
      
      setAnalytics({
        totalViews,
        totalClicks,
        totalLikes,
        totalPosts,
        ctr
      });
    } catch (error) {
      console.error('Error fetching advertising posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    fetchAdvertisingPosts();
  };

  useEffect(() => {
    if (user) {
      fetchAdvertisingPosts();
    }
  }, [user]);

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Advertising Dashboard</h1>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Ad
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Posts</p>
              <p className="text-xl font-bold text-foreground">{analytics.totalPosts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Eye className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-xl font-bold text-foreground">{analytics.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <MousePointer className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Clicks</p>
              <p className="text-xl font-bold text-foreground">{analytics.totalClicks.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Likes</p>
              <p className="text-xl font-bold text-foreground">{analytics.totalLikes.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CTR</p>
              <p className="text-xl font-bold text-foreground">{analytics.ctr}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Posts Section */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Your Advertising Posts</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : advertisingPosts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {advertisingPosts.map((post) => (
              <AdvertisingPostCard
                key={post.id}
                post={post}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No advertising posts yet</h3>
            <p className="text-muted-foreground mb-4">Create your first advertising post to start reaching your audience!</p>
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Ad
            </Button>
          </div>
        )}
      </div>

      <CreateAdvertisingPostModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onPostCreated={handlePostCreated}
      />

      {selectedPost && (
        <AdvertisingPostDetailModal
          post={selectedPost}
          open={!!selectedPost}
          onOpenChange={(open) => !open && setSelectedPost(null)}
          onVisitSite={() => {
            if (selectedPost?.redirect_url) {
              window.open(selectedPost.redirect_url, '_blank');
            }
          }}
        />
      )}
    </div>
  );

  return isMobile ? (
    <MobileLayout>
      <div className="container mx-auto px-4 py-6">
        {content}
      </div>
    </MobileLayout>
  ) : (
    <Layout>
      {content}
    </Layout>
  );
}
