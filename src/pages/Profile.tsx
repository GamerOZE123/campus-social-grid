import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import PostCard from '@/components/post/PostCard';
import EditProfileModal from '@/components/profile/EditProfileModal';
import MessageButton from '@/components/profile/MessageButton';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, UserMinus, Edit, Camera } from 'lucide-react';
import MobileHeader from '@/components/layout/MobileHeader';
// Re-importing to force refresh
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

interface ProfileData {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  university: string;
  major: string;
  bio: string;
  followers_count: number;
  following_count: number;
  country?: string;
  state?: string;
  area?: string;
  banner_url?: string;
  banner_height?: number;
  banner_position?: number;
}

interface PostWithProfile {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  hashtags?: string[];
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
    university: string;
  };
}

// Transform post for PostCard component
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
  hashtags?: string[];
}

export default function Profile() {
  const { user } = useAuth();
  const { userId } = useParams<{ userId?: string }>();
  const isOwnProfile = !userId || userId === user?.id;
  const profileId = userId || user?.id;
  const isMobile = useIsMobile();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Use profileData.banner_url and banner_height if available
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerHeight, setBannerHeight] = useState<number>(180);

  useEffect(() => {
    if (profileData?.banner_url) setBannerUrl(profileData.banner_url);
    if (profileData?.banner_height) setBannerHeight(profileData.banner_height);
  }, [profileData?.banner_url, profileData?.banner_height]);

  useEffect(() => {
    if (profileId) {
      fetchUserData(profileId);
      fetchUserPosts(profileId);
    }
  }, [profileId]);

  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (user && profileData && !isOwnProfile) {
        try {
          const { data, error } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', profileData.user_id)
            .single();

          if (error && error.code !== 'PGRST116') throw error;
          setIsFollowing(!!data);
        } catch (error) {
          console.error("Error checking following status:", error);
        }
      }
    };

    checkFollowingStatus();
  }, [user, profileData, isOwnProfile]);

  const fetchUserPosts = async (userId: string) => {
    try {
      // First get the posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Then get the profile data for the user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url, university')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Combine the data
      const postsWithProfile: PostWithProfile[] = (postsData || []).map(post => ({
        ...post,
        profiles: profileData
      }));

      setPosts(postsWithProfile);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url, university, major, bio, followers_count, following_count, country, state, area, banner_url, banner_height, banner_position')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfileData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !profileData) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileData.user_id);

        if (error) throw error;
        setIsFollowing(false);
        toast.success(`Unfollowed ${profileData.full_name || profileData.username}`);
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert([{ follower_id: user.id, following_id: profileData.user_id }]);

        if (error) throw error;
        setIsFollowing(true);
        toast.success(`Followed ${profileData.full_name || profileData.username}`);
      }

      // Refresh profile data to update counts
      fetchUserData(profileId);
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      toast.error("Failed to follow/unfollow user");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    fetchUserData(profileId);
  };

  // Banner upload handler (for EditProfileModal)
  const handleBannerChange = (url: string, height: number) => {
    setBannerUrl(url);
    setBannerHeight(height);
  };

  const transformPostsForPostCard = (posts: PostWithProfile[]): TransformedPost[] => {
    return posts.map(post => ({
      id: post.id,
      content: post.content,
      image_url: post.image_url,
      created_at: post.created_at,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      user_id: post.user_id,
      user_name: post.profiles.full_name || post.profiles.username || 'Unknown',
      user_username: post.profiles.username || 'user',
      user_university: post.profiles.university || 'University',
      hashtags: post.hashtags
    }));
  };

  if (loading) return <Layout><div className="text-center py-8">Loading...</div></Layout>;
  if (!profileData) return <Layout><div className="text-center py-8">User not found</div></Layout>;

  const transformedPosts = transformPostsForPostCard(posts);

  return (
    <Layout>
      {isMobile && <MobileHeader />}

      <div className="max-w-2xl mx-auto">
        {/* Banner Section */}
        <div className="relative">
          <div
            className="w-full bg-muted/30 rounded-b-xl overflow-hidden"
            style={{
              aspectRatio: '3/1',
              backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: `center ${profileData.banner_position || 50}%`,
              position: 'relative',
              borderBottomRightRadius: 0, // <-- added
              borderBottomLeftRadius: 0,  // <-- added
            }}
          >
            {/* Edit Banner Button (only own profile) */}
            {isOwnProfile && (
              <button
                className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition"
                onClick={() => setIsEditModalOpen(true)}
                aria-label="Edit banner"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>
          {/* Avatar - bottom center, overlapping banner */}
          <div className="absolute left-1/2 -bottom-10 transform -translate-x-1/2">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent border-4 border-background flex items-center justify-center shadow-lg">
              {profileData.avatar_url ? (
                <img
                  src={profileData.avatar_url}
                  alt={profileData.full_name || profileData.username}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {profileData.full_name?.charAt(0) || profileData.username?.charAt(0) || 'U'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 pb-4 px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            {profileData.full_name || profileData.username}
          </h1>
          <p className="text-muted-foreground">@{profileData.username}</p>
          {profileData.bio && <p className="mt-2">{profileData.bio}</p>}
          {/* ...other info... */}
          <div className="flex justify-center gap-6 mt-4">
            <div>
              <span className="font-bold">{posts.length}</span>
              <span className="text-muted-foreground text-sm ml-1">Posts</span>
            </div>
            <div>
              <span className="font-bold">{profileData.followers_count || 0}</span>
              <span className="text-muted-foreground text-sm ml-1">Followers</span>
            </div>
            <div>
              <span className="font-bold">{profileData.following_count || 0}</span>
              <span className="text-muted-foreground text-sm ml-1">Following</span>
            </div>
          </div>
          {/* Edit Profile Button */}
          {isOwnProfile && (
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              className="mt-4"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Posts */}
        <div className="space-y-4 px-4">
          {transformedPosts.length > 0 ? (
            transformedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">No posts yet</div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdate={handleProfileUpdate}
        onBannerChange={handleBannerChange}
        bannerUrl={bannerUrl}
        bannerHeight={bannerHeight}
      />
    </Layout>
  );
}
