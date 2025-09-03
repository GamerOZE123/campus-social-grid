import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share, ExternalLink, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <div 
      className="cursor-pointer transition-colors hover:bg-muted/5 px-4 py-3 border-b border-border/50"
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Company Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          {post.company_profiles?.logo_url ? (
            <img 
              src={post.company_profiles.logo_url} 
              alt={post.company_profiles.company_name}
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">
                {post.company_profiles?.company_name?.[0] || 'A'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-foreground">
                {post.company_profiles?.company_name || 'Company'}
              </p>
              <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                Ad
              </Badge>
              <span className="text-sm text-muted-foreground">· {formatDate(post.created_at)}</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-foreground">
              {post.title}
            </h3>
            {post.description && (
              <p className="text-foreground text-sm">
                {post.description}
              </p>
            )}
          </div>

          {/* Image */}
          {post.image_url && (
            <div className="relative rounded-2xl overflow-hidden">
              <img 
                src={post.image_url} 
                alt={post.title}
                className="w-full h-auto object-cover max-h-96"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-start gap-6 pt-2 max-w-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "flex items-center gap-2 hover:bg-muted/50",
                liked && "text-red-500 hover:text-red-600"
              )}
            >
              <Heart className={cn("w-5 h-5", liked && "fill-current")} />
              <span className="font-medium">{likesCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 hover:bg-muted/50"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">0</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 hover:bg-muted/50"
            >
              <Share className="w-5 h-5" />
              <span className="font-medium">Share</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClick}
              className="flex items-center gap-2 hover:bg-muted/50 ml-auto"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="font-medium">Visit</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}