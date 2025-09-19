import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Plus, BarChart3, Eye, MousePointer, Heart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdvertisingPostCard from '@/components/advertising/AdvertisingPostCard';
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

  useEffect(() => {
    if (user) {
      fetchAdvertisingPosts();
    }
  }, [user]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Advertising Dashboard</h1>
            </div>
            <Button
              size={isMobile ? "default" : "lg"}
              className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Ad
            </Button>
          </div>

          {/* Analytics Cards */}
          {!loading && advertisingPosts.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Total Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {analytics.totalPosts}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {analytics.totalViews.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
                    <MousePointer className="w-4 h-4" />
                    Clicks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {analytics.totalClicks.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-red-200 dark:border-red-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Likes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {analytics.totalLikes.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    CTR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {analytics.ctr.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Posts List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : advertisingPosts.length > 0 ? (
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground mb-4">Your Advertising Posts</h2>
              <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                {advertisingPosts.map((post: any, index) => (
                  <div key={post.id} className={index !== advertisingPosts.length - 1 ? "border-b border-border" : ""}>
                    <AdvertisingPostCard
                      post={post}
                      showDetailModal={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent className="space-y-4">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No advertising posts yet</h3>
                  <p className="text-muted-foreground">Create your first ad to start reaching your audience!</p>
                </div>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Ad
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Create Advertising Post Modal */}
          <CreateAdvertisingPostModal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            onPostCreated={fetchAdvertisingPosts}
          />
        </div>
      </div>
    </Layout>
  );
}
