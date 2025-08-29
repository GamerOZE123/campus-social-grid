import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { ArrowLeft, Star, Users, Briefcase, Target, TrendingUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CreateAdvertisingPostModal from '@/components/advertising/CreateAdvertisingPostModal';
import AdvertisingPostCard from '@/components/advertising/AdvertisingPostCard';

const advertisingPackages = [
  {
    id: 'basic',
    name: 'Campus Spotlight',
    price: '$99/month',
    features: [
      'Featured company profile',
      'Priority job posting placement',
      'Basic analytics dashboard',
      'Email support'
    ],
    color: 'border-blue-200',
    popular: false
  },
  {
    id: 'premium',
    name: 'University Partner',
    price: '$299/month',
    features: [
      'Everything in Campus Spotlight',
      'Sponsored content placement',
      'Student engagement metrics',
      'Direct messaging with students',
      'Custom branding options',
      'Priority support'
    ],
    color: 'border-primary',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Campus Champion',
    price: '$599/month',
    features: [
      'Everything in University Partner',
      'Exclusive event partnerships',
      'Campus representative program',
      'Advanced targeting options',
      'White-label solutions',
      'Dedicated account manager'
    ],
    color: 'border-purple-200',
    popular: false
  }
];

const benefits = [
  {
    icon: Users,
    title: 'Access to Top Talent',
    description: 'Connect with ambitious students from top universities ready to make an impact.'
  },
  {
    icon: Target,
    title: 'Targeted Reach',
    description: 'Reach students based on their major, interests, and career aspirations.'
  },
  {
    icon: TrendingUp,
    title: 'Brand Awareness',
    description: 'Build your brand presence among the next generation of professionals.'
  },
  {
    icon: Briefcase,
    title: 'Quality Applicants',
    description: 'Get applications from pre-qualified students who match your requirements.'
  }
];

export default function Advertising() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userType, setUserType] = useState<'student' | 'company'>('company');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCompanies: 0,
    jobsPosted: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [advertisingPosts, setAdvertisingPosts] = useState([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  const fetchAdvertisingPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('advertising_posts')
        .select(`
          *,
          company_profiles (
            company_name,
            logo_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdvertisingPosts(data || []);
    } catch (error) {
      console.error('Error fetching advertising posts:', error);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('advertising_likes')
        .select('advertising_post_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserLikes(new Set(data?.map(like => like.advertising_post_id) || []));
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .single();
        
        if (profileError) throw profileError;
        if (profileData) {
          setUserType(profileData.user_type || 'company');
        }

        // Fetch platform stats
        const [studentsResult, companiesResult, jobsResult] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact' }).eq('user_type', 'student'),
          supabase.from('company_profiles').select('id', { count: 'exact' }),
          supabase.from('jobs').select('id', { count: 'exact' }).eq('is_active', true)
        ]);

        setStats({
          totalStudents: studentsResult.count || 0,
          activeCompanies: companiesResult.count || 0,
          jobsPosted: jobsResult.count || 0
        });

        // Fetch advertising posts and user likes
        await Promise.all([
          fetchAdvertisingPosts(),
          fetchUserLikes()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (userType !== 'company') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">
            Advertising features are only available for company accounts.
          </p>
          <Button onClick={() => navigate('/university')}>
            Back to University Hub
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/university')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Company Advertising</h1>
            <p className="text-muted-foreground">Reach talented students and grow your business</p>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">{stats.totalStudents.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Active Students</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">{stats.activeCompanies.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Partner Companies</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">{stats.jobsPosted.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Active Job Postings</div>
          </Card>
        </div>

        {/* Advertising Posts Section */}
        {advertisingPosts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground text-center">Your Advertising Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advertisingPosts.map((post: any) => (
                <AdvertisingPostCard
                  key={post.id}
                  post={post}
                  isLiked={userLikes.has(post.id)}
                  onLikeUpdate={() => {
                    fetchUserLikes();
                    fetchAdvertisingPosts();
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Benefits Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground text-center">Why Advertise With Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <Card key={index} className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Pricing Packages */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground text-center">Choose Your Package</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {advertisingPackages.map((pkg) => (
              <Card key={pkg.id} className={`p-6 relative ${pkg.color} ${pkg.popular ? 'border-2' : ''}`}>
                {pkg.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">{pkg.name}</h3>
                  <div className="text-3xl font-bold text-primary mb-2">{pkg.price}</div>
                </div>
                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={pkg.popular ? "default" : "outline"}
                >
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="p-8 text-center bg-gradient-to-r from-primary/5 to-primary/10">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Ready to Connect with Top Talent?
          </h2>
          <p className="text-muted-foreground mb-6">
            Join hundreds of companies already finding their next great hires through our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              Start Advertising Today
            </Button>
            <Button variant="outline" size="lg">
              Schedule a Demo
            </Button>
          </div>
        </Card>

        {/* Floating Add Post Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Create Advertising Post Modal */}
        <CreateAdvertisingPostModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onPostCreated={() => {
            fetchAdvertisingPosts();
            fetchUserLikes();
          }}
        />
      </div>
    </Layout>
  );
}