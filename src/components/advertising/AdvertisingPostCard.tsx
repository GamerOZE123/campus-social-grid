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
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group"
      onClick={handleClick}
    >
      {/* Sponsored Badge */}
      <div className="relative">
        <Badge 
          variant="secondary" 
          className="absolute top-3 left-3 z-10 bg-primary/90 text-primary-foreground"
        >
          Sponsored
        </Badge>
        
        {/* Image */}
        <div className="relative h-64 overflow-hidden">
          <img 
            src={post.image_url} 
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Company Info */}
        {post.company_profiles && (
          <div className="flex items-center gap-2">
            {post.company_profiles.logo_url && (
              <img 
                src={post.company_profiles.logo_url} 
                alt={post.company_profiles.company_name}
                className="w-6 h-6 rounded-full object-cover"
              />
            )}
            <span className="text-sm text-muted-foreground">
              {post.company_profiles.company_name}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-lg text-foreground line-clamp-2">
          {post.title}
        </h3>

        {/* Description */}
        {post.description && (
          <p className="text-muted-foreground text-sm line-clamp-2">
            {post.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="flex items-center gap-1 p-1"
            >
              <Heart 
                className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
              />
              <span className="text-sm">{likesCount}</span>
            </Button>

            {/* Click Count */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">{post.click_count} clicks</span>
            </div>
          </div>

          {/* Visit Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClick}
            className="flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Visit
          </Button>
        </div>
      </div>
    </Card>
  );
}