import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ExternalLink, TrendingUp, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PostContent from '@/components/post/PostContent';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

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

  const handleComment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // For ads, we could show a modal or redirect to the ad's page
    handleClick();
  };

  const handleShare = () => {
    // For ads, we could share the ad URL
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description || '',
        url: post.redirect_url
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(post.redirect_url);
      toast({
        title: "Link copied",
        description: "Ad link copied to clipboard",
      });
    }
  };

  // Extract company info
  const companyName = post.company_profiles?.company_name || 'Company';
  const companyLogo = post.company_profiles?.logo_url;
  const isOwnAd = user?.id === post.company_id;

  return (
    <div 
      className="cursor-pointer hover:bg-muted/20 transition-colors overflow-hidden group w-full p-4 space-y-3 border-b border-border"
      onClick={handleClick}
    >
      {/* Header - Similar to PostHeader */}
      <div className="flex gap-3">
        {/* Company Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          {companyLogo ? (
            <img src={companyLogo} alt={companyName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-white">
              {companyName.charAt(0)}
            </span>
          )}
        </div>

        {/* Right section */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            {/* Company info */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-foreground">
                {companyName}
              </p>
              <Badge 
                variant="secondary" 
                className="bg-primary/90 text-primary-foreground text-xs"
              >
                Ad
              </Badge>
              <span className="text-sm text-muted-foreground">· {formatDate(post.created_at)}</span>
            </div>

            {/* Dropdown actions - only show for own ads */}
            {isOwnAd && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    Edit Ad
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => e.stopPropagation()}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete Ad
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Title and Description as Caption */}
          <div className="mt-1">
            <h3 className="font-medium text-foreground mb-1">
              {post.title}
            </h3>
            {post.description && (
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {post.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Image - Similar to PostContent */}
      <div className="flex justify-center">
        <PostContent
          content=""
          imageUrl={post.image_url}
        />
      </div>

      {/* Actions - Similar to PostActions */}
      <div className="flex items-center justify-center pt-2">
        <div className="flex items-center gap-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex items-center gap-2 hover:bg-muted/50 ${
              liked ? "text-red-500 hover:text-red-600" : ""
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
            <span className="font-medium">{likesCount}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleComment}
            className="flex items-center gap-2 hover:bg-muted/50"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">{post.click_count}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
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
