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
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('advertising_posts')
        .select('*')
        .eq('is_active', true)
        .eq('company_id', user.id)
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
    if (user) {
      fetchAdvertisingPosts();
    }
  }, [user]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">My Advertising Posts</h1>
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
            You haven't created any advertising posts yet. Click the + button to create your first ad!
          </div>
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
