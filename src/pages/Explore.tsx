import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Search, User } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useNavigate } from 'react-router-dom';
import TrendingHashtags from '@/components/explore/TrendingHashtags';
import { supabase } from '@/integrations/supabase/client';
import MobileHeader from '@/components/layout/MobileHeader';
// Re-importing to force refresh
import { useIsMobile } from '@/hooks/use-mobile';

interface PostImage {
  id: string;
  image_url: string;
}

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [postImages, setPostImages] = useState<PostImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const { users, loading, searchUsers } = useUsers();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const shuffleArray = (array: any[]) => {
    return array
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  };

  const fetchPostImages = async () => {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, image_url')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPostImages(shuffleArray(posts || [])); // <-- shuffle before setting
    } catch (error) {
      console.error('Error fetching post images:', error);
    } finally {
      setImagesLoading(false);
    }
  };

  useEffect(() => {
    fetchPostImages();
  }, []);

  const handleImageClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  return (
    <Layout>
      {/* Mobile Header */}
      {isMobile && <MobileHeader />}
      
      <div className="space-y-6">
        {/* Search Header */}
        <div className="post-card">
          <h2 className="text-2xl font-bold text-foreground mb-4">Explore</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
        </div>

        {/* Trending Hashtags */}
        {!searchQuery && <TrendingHashtags />}

        {/* Search Results */}
        {searchQuery && (
          <div className="post-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Users</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-muted-foreground mt-2">Searching...</p>
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.user_id}
                    onClick={() => handleUserClick(user.user_id)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">
                        {user.full_name || user.username}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </p>
                      {user.university && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.university}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No users found for "{searchQuery}"
              </p>
            )}
          </div>
        )}

        {/* Image Collage when no search */}
        {!searchQuery && (
          <div className="post-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Posts</h3>
            {imagesLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading images...</p>
              </div>
            ) : postImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {postImages.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handleImageClick(post.id)}
                    className="aspect-square bg-surface rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                  >
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No images to display yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
