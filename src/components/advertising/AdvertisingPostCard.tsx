import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ExternalLink, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdvertisingPost {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  redirect_url: string;
  click_count: number;
  likes_count: number;
  created_at: string;
  company_id: string;
  company_profiles?: {
    company_name: string;
    logo_url?: string;
  };
}

interface AdvertisingPostCardProps {
  post: AdvertisingPost;
  onLikeUpdate?: () => void;
  isLiked?: boolean;
}

export default function AdvertisingPostCard({ 
  post, 
  onLikeUpdate,
  isLiked = false
}: AdvertisingPostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  const handleClick = async () => {
    try {
      // Track the click
      await supabase
        .from('advertising_clicks')
        .insert({
          advertising_post_id: post.id,
          user_id: user?.id || null,
          ip_address: null, // Could be populated from IP detection service
          user_agent: navigator.userAgent
        });

      // Open the URL in a new tab
      window.open(post.redirect_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error tracking click:', error);
      // Still redirect even if tracking fails
      window.open(post.redirect_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (liked) {
        // Unlike
        await supabase
          .from('advertising_likes')
          .delete()
          .eq('advertising_post_id', post.id)
          .eq('user_id', user.id);
        
        setLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // Like
        await supabase
          .from('advertising_likes')
          .insert({
            advertising_post_id: post.id,
            user_id: user.id
          });
        
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }

      onLikeUpdate?.();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div 
      className="cursor-pointer hover:bg-muted/20 transition-colors overflow-hidden group w-full p-4 space-y-3 border-b border-border"
      onClick={handleClick}
    >
      {/* Company Info Header */}
      {post.company_profiles && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {post.company_profiles.logo_url && (
              <img 
                src={post.company_profiles.logo_url} 
                alt={post.company_profiles.company_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div>
              <span className="font-medium text-foreground">
                {post.company_profiles.company_name}
              </span>
              <div className="text-sm text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-primary/90 text-primary-foreground text-xs"
          >
            Ad
          </Badge>
        </div>
      )}

      {/* Title */}
      <h3 className="font-medium text-foreground">
        {post.title}
      </h3>

      {/* Description */}
      {post.description && (
        <p className="text-muted-foreground text-sm">
          {post.description}
        </p>
      )}

      {/* Ad Label positioned above image */}
      <div className="relative">
        {/* Image */}
        <div className="relative overflow-hidden rounded-lg">
          <img 
            src={post.image_url} 
            alt={post.title}
            className="w-full h-auto object-cover group-hover:opacity-95 transition-opacity duration-300"
          />
        </div>
      </div>

      {/* Actions - Similar to regular posts */}
      <div className="flex items-center justify-center pt-2">
        <div className="flex items-center gap-8">
          {/* Like Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className="flex items-center gap-2 hover:bg-muted/50"
          >
            <Heart 
              className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
            />
            <span className="font-medium">{likesCount}</span>
          </Button>

          {/* Click Count */}
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 hover:bg-muted/50"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">{post.click_count}</span>
          </Button>

          {/* Visit Button */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleClick}
            className="flex items-center gap-2 hover:bg-muted/50"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="font-medium">Visit</span>
          </Button>
        </div>
      </div>
    </div>
  );
}