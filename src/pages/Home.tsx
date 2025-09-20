import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import PostCard from '@/components/post/PostCard';
import AdvertisingPostCard from '@/components/advertising/AdvertisingPostCard';
import ImageUploadButton from '@/components/post/ImageUploadButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MobileHeader from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';

// Import the new modal component
import CommentsModal from '@/components/post/CommentsModal'; // You will need to create this file

// ... (your existing interface definitions) ...
// (All the interface code you provided)
// ...

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
    const [mixedPosts, setMixedPosts] = useState<MixedPost[]>([]);
    const [seenPostIds, setSeenPostIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const isMobile = useIsMobile();

    // New state for the comments modal
    const [selectedPost, setSelectedPost] = useState<TransformedPost | null>(null);
    const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

    // New handler function to open the modal
    const handleOpenComments = (post: TransformedPost) => {
        setSelectedPost(post);
        setIsCommentsModalOpen(true);
    };

    // New handler function to close the modal
    const handleCloseComments = () => {
        setIsCommentsModalOpen(false);
        setSelectedPost(null);
    };

    // ... (your existing fetchPosts function, unchanged) ...
    const fetchPosts = async () => {
        try {
          console.log('Fetching posts...');
          
          let query = supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
    
          if (seenPostIds.size > 0) {
            const seenIds = Array.from(seenPostIds);
            query = query.not('id', 'in', `(${seenIds.map(id => `"${id}"`).join(',')})`);
          }
    
          const { data: postsData, error: postsError } = await query;
          
          if (postsError) {
            console.error('Error fetching posts:', postsError);
            throw postsError;
          }
          
          const { data: advertisingData, error: advertisingError } = await supabase
            .from('advertising_posts')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false});
          
          let advertisingWithProfiles = [];
          if (advertisingData && advertisingData.length > 0) {
            const companyIds = [...new Set(advertisingData.map(ad => ad.company_id))];
            const { data: companyProfilesData } = await supabase
              .from('company_profiles')
              .select('user_id, company_name, logo_url')
              .in('user_id', companyIds);
            
            advertisingWithProfiles = advertisingData.map(ad => ({
              ...ad,
              company_profiles: companyProfilesData?.find(cp => cp.user_id === ad.company_id) || null
            }));
          }
          
          if (advertisingError) {
            console.error('Error fetching advertising posts:', advertisingError);
            throw advertisingError;
          }
    
          console.log('Fetched posts:', postsData);
          console.log('Fetched advertising posts:', advertisingWithProfiles);
          
          if (!postsData || postsData.length === 0) {
            setMixedPosts([]);
            setLoading(false);
            return;
          }
          
          const userIds = [...new Set(postsData.map(post => post.user_id))];
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, full_name, username, university, major, avatar_url')
            .in('user_id', userIds);
          
          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            throw profilesError;
          }
          
          const profilesMap = new Map();
          profilesData?.forEach(profile => {
            profilesMap.set(profile.user_id, profile);
          });
          
          const transformedPosts: TransformedPost[] = postsData.map((post) => {
            const profile = profilesMap.get(post.user_id);
            
            const userName = profile?.full_name || profile?.username || 'Anonymous User';
            const userUsername = profile?.username || 'user';
            const userUniversity = profile?.university || 'University';
            
            return {
              id: post.id,
              content: post.content || '',
              image_url: post.image_url,
              image_urls: post.image_urls,
              created_at: post.created_at,
              likes_count: post.likes_count || 0,
              comments_count: post.comments_count || 0,
              views_count: post.views_count || 0,
              user_id: post.user_id,
              user_name: userName,
              user_username: userUsername,
              user_university: userUniversity,
              hashtags: post.hashtags || [],
              profiles: {
                full_name: profile?.full_name || 'Anonymous User',
                username: profile?.username || 'user',
                avatar_url: profile?.avatar_url
              }
            };
          }).sort(() => Math.random() - 0.5);
    
          const newPostIds = transformedPosts.map(p => p.id);
          setSeenPostIds(prev => new Set([...prev, ...newPostIds]));
    
          if (transformedPosts.length === 0 && seenPostIds.size > 0) {
            setSeenPostIds(new Set());
            fetchPosts();
            return;
          }
    
          const mixedArray: MixedPost[] = [];
          let advertisingIndex = 0;
          
          const shuffledAds = advertisingWithProfiles ? [...advertisingWithProfiles].filter(ad => 
            ad && typeof ad === 'object' && 'id' in ad
          ).sort(() => Math.random() - 0.5) : [];
          
          transformedPosts.forEach((post, index) => {
            mixedArray.push({
              type: 'regular',
              data: post
            });
            
            if ((index + 1) % 4 === 0 && advertisingIndex < shuffledAds.length) {
              const adPost = shuffledAds[advertisingIndex];
              mixedArray.push({
                type: 'advertising',
                data: adPost as any
              });
              advertisingIndex++;
            }
          });
          
          setMixedPosts(mixedArray);
        } catch (error) {
          console.error('Error fetching posts:', error);
          setMixedPosts([]);
        } finally {
          setLoading(false);
        }
    };
    // ... (your existing useEffect hook, unchanged) ...
    useEffect(() => {
        fetchPosts();
    
        const channel = supabase
          .channel('posts_channel')
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'posts' },
            (payload) => {
              console.log('New post added:', payload);
              fetchPosts();
            }
          )
          .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'posts' },
            (payload) => {
              console.log('Post updated:', payload);
              fetchPosts();
            }
          )
          .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'advertising_posts' },
            (payload) => {
              console.log('New advertising post added:', payload);
              fetchPosts();
            }
          )
          .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'advertising_posts' },
            (payload) => {
              console.log('Advertising post updated:', payload);
              fetchPosts();
            }
          )
          .subscribe();
    
        return () => {
          supabase.removeChannel(channel);
        };
    }, []);

    if (loading) {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto pt-2">
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {isMobile && <MobileHeader />}
            
            <div className="max-w-2xl mx-auto pt-6 -mt-4">
                <div className="space-y-6">
                    {mixedPosts.length > 0 ? (
                        mixedPosts.map((mixedPost) => {
                            return mixedPost.type === 'regular' ? (
                                <PostCard
                                    key={mixedPost.data.id}
                                    post={mixedPost.data as TransformedPost}
                                    onPostUpdated={fetchPosts}
                                    // Pass the new handler function as a prop
                                    onCommentClick={handleOpenComments}
                                />
                            ) : (
                                <AdvertisingPostCard
                                    key={mixedPost.data.id}
                                    post={mixedPost.data as AdvertisingPost}
                                    onLikeUpdate={fetchPosts}
                                />
                            );
                        })
                    ) : (
                        <div className="post-card text-center py-12">
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Welcome to the Community!
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                No posts yet. Be the first to share something with your community!
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Click the + button below to create your first post.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Conditionally render the comments modal */}
            {isCommentsModalOpen && selectedPost && (
                <CommentsModal
                    post={selectedPost}
                    onClose={handleCloseComments}
                />
            )}

            <ImageUploadButton onPostCreated={fetchPosts} />
        </Layout>
    );
}