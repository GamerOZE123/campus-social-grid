import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/layout/MobileLayout';
import { Plus, BarChart3, Eye, MousePointer, Heart, TrendingUp, Settings, Crown, Upload, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AdvertisingPostCard from '@/components/advertising/AdvertisingPostCard';
import CreateAdvertisingPostModal from '@/components/advertising/CreateAdvertisingPostModal';
import CreateHomepageBannerModal from '@/components/advertising/CreateHomepageBannerModal';
import SubscriptionTierCard from '@/components/advertising/SubscriptionTierCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Advertising() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [advertisingPosts, setAdvertisingPosts] = useState([]);
  const [homepageBanners, setHomepageBanners] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalClicks: 0,
    totalLikes: 0,
    totalPosts: 0,
    ctr: 0,
    bannerViews: 0,
    bannerClicks: 0,
    bannerCtr: 0
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
      
      const { data: companyProfile, error: profileError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setCompanyProfile(companyProfile);
      
      const postsWithProfiles = (data || []).map(post => ({
        ...post,
        company_profiles: {
          company_name: companyProfile?.company_name || 'Company',
          logo_url: companyProfile?.logo_url
        }
      }));
      
      setAdvertisingPosts(postsWithProfiles);
      
      const totalViews = postsWithProfiles.reduce((sum, post) => sum + (post.views_count || 0), 0);
      const totalClicks = postsWithProfiles.reduce((sum, post) => sum + (post.click_count || 0), 0);
      const totalLikes = postsWithProfiles.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const totalPosts = postsWithProfiles.length;
      const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100) : 0;
      
      setAnalytics({
        totalViews,
        totalClicks,
        totalLikes,
        totalPosts,
        ctr,
        bannerViews: 0,
        bannerClicks: 0,
        bannerCtr: 0
      });
    } catch (error) {
      console.error('Error fetching advertising data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAdvertisingPosts();
    }
  }, [user]);

  const subscriptionTiers = [
    {
      tier: 'starter' as const,
      title: 'Starter',
      price: 'Free',
      description: 'Perfect for small businesses getting started',
      features: {
        postsPerMonth: 5,
        targeting: 'None',
        analytics: 'Basic',
        bannerAds: false,
        priorityPlacement: false,
        support: 'Community'
      }
    },
    {
      tier: 'growth' as const,
      title: 'Growth',
      price: '$29',
      description: 'Ideal for growing businesses',
      features: {
        postsPerMonth: 15,
        targeting: 'Basic (University, Location)',
        analytics: 'Standard',
        bannerAds: false,
        priorityPlacement: false,
        support: 'Email'
      },
      popular: true
    },
    {
      tier: 'premium' as const,
      title: 'Premium',
      price: '$99',
      description: 'For established businesses seeking maximum reach',
      features: {
        postsPerMonth: 25,
        targeting: 'Advanced (All filters)',
        analytics: 'Advanced with insights',
        bannerAds: true,
        priorityPlacement: true,
        support: 'Priority'
      }
    }
  ];

  const renderContent = () => (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Advertising Dashboard</h1>
            {companyProfile && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">
                  {companyProfile.subscription_tier} Plan
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {companyProfile.monthly_posts_used}/{companyProfile.monthly_posts_limit} posts used
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="shadow-lg hover:shadow-xl transition-shadow"
            disabled={companyProfile && companyProfile.monthly_posts_used >= companyProfile.monthly_posts_limit}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Ad
          </Button>
          {companyProfile?.subscription_tier === 'premium' && (
            <Button
              onClick={() => setShowBannerModal(true)}
              variant="outline"
              className="shadow-lg hover:shadow-xl transition-shadow"
            >
              <Upload className="w-5 h-5 mr-2" />
              Create Banner
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          {!loading && advertisingPosts.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalPosts}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MousePointer className="w-4 h-4" />
                    Clicks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalClicks.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    CTR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.ctr.toFixed(1)}%</div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : advertisingPosts.length > 0 ? (
            <div className="space-y-4">
              {advertisingPosts.map((post: any) => (
                <AdvertisingPostCard key={post.id} post={post} showDetailModal={true} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No ads yet</h3>
                <p className="text-muted-foreground mb-4">Create your first ad to start reaching students!</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Ad
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="subscription">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Subscription Plans</h2>
              <p className="text-muted-foreground">Choose the plan that fits your advertising needs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionTiers.map((tierData) => (
                <SubscriptionTierCard
                  key={tierData.tier}
                  {...tierData}
                  currentTier={companyProfile?.subscription_tier || 'starter'}
                  onUpgrade={fetchAdvertisingPosts}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <CreateAdvertisingPostModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onPostCreated={fetchAdvertisingPosts}
      />

      <CreateHomepageBannerModal
        open={showBannerModal}
        onOpenChange={setShowBannerModal}
        onBannerCreated={fetchAdvertisingPosts}
      />
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
      <div className="container mx-auto px-4 py-6">
        {renderContent()}
      </div>
    </Layout>
  );
}