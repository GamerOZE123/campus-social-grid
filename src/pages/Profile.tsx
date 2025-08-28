import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import PostCard from '@/components/post/PostCard';
import EditProfileModal from '@/components/profile/EditProfileModal';
import MessageButton from '@/components/profile/MessageButton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, UserMinus, Edit } from 'lucide-react';
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
        .select('user_id, username, full_name, avatar_url, university, major, bio, followers_count, following_count')
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
      {/* Mobile Header */}
      {isMobile && <MobileHeader />}
      
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="post-card">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto md:mx-0">
              <span className="text-2xl md:text-3xl font-bold text-white">
                {profileData.full_name?.charAt(0) || profileData.username?.charAt(0) || 'U'}
              </span>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {profileData.full_name || profileData.username}
              </h1>
              <div className="space-y-1 text-muted-foreground mb-4">
                {profileData.username && (
                  <p className="text-sm">@{profileData.username}</p>
                )}
                {profileData.university && (
                  <p className="text-sm">{profileData.university}</p>
                )}
                {profileData.major && (
                  <p className="text-sm">{profileData.major}</p>
                )}
                {profileData.bio && (
                  <p className="text-sm mt-2">{profileData.bio}</p>
                )}
              </div>
              
              <div className="flex justify-center md:justify-start gap-4 mb-4">
                <div className="text-center">
                  <p className="font-bold text-foreground">{posts.length}</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-foreground">{profileData.followers_count || 0}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-foreground">{profileData.following_count || 0}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
              </div>
              
              <div className="flex justify-center md:justify-start gap-2">
                {isOwnProfile ? (
                  <Button
                    onClick={() => setIsEditModalOpen(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? "outline" : "default"}
                      className="flex items-center gap-2"
                      disabled={followLoading}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Follow
                        </>
                      )}
                    </Button>
                    <MessageButton userId={profileData.user_id} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {transformedPosts.length > 0 ? (
            transformedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="post-card text-center py-8">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          )}
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdate={handleProfileUpdate}
      />
    </Layout>
  );
}
