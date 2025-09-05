import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdvertisingPostCard from '@/components/advertising/AdvertisingPostCard';
import CreateAdvertisingPostModal from '@/components/advertising/CreateAdvertisingPostModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function Advertising() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [advertisingPosts, setAdvertisingPosts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvertisingPosts();
  }, []);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Advertising Posts</h1>
          <Button
            size="lg"
            className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow"
            onClick={() => setShowCreateModal(true)}
            aria-label="Add Advertising Post"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : advertisingPosts.length > 0 ? (
          <div className="space-y-6">
            {advertisingPosts.map((post: any) => (
              <AdvertisingPostCard
                key={post.id}
                post={post}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No advertising posts yet.
          </div>
        )}

        {/* What's Your Thought Section */}
        <div className="mt-10 p-6 rounded-xl bg-surface shadow">
          <h2 className="text-xl font-bold text-foreground mb-2">What's your thought?</h2>
          <p className="text-muted-foreground mb-4">
            Share your feedback or suggestions about advertising on campus.
          </p>
          <textarea
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground resize-none"
            rows={3}
            placeholder="Type your thoughts here..."
          />
          <Button className="mt-3">Submit</Button>
        </div>

        {/* Create Advertising Post Modal */}
        <CreateAdvertisingPostModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onPostCreated={fetchAdvertisingPosts}
        />
      </div>
    </Layout>
  );
}
