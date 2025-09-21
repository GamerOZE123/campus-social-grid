import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye, MousePointer, Heart, Calendar } from 'lucide-react';
import ImageDisplayComponent from '@/components/post/ImageDisplayComponent';

interface AdvertisingPost {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  image_thumbnail_url?: string;
  image_medium_url?: string;
  image_original_url?: string;
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

interface AdvertisingPostDetailModalProps {
  post: AdvertisingPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVisitSite: () => void;
}

export default function AdvertisingPostDetailModal({
  post,
  open,
  onOpenChange,
  onVisitSite
}: AdvertisingPostDetailModalProps) {
  if (!post) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const companyName = post.company_profiles?.company_name || 'Company';
  const companyLogo = post.company_profiles?.logo_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {/* Company Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">
                  {companyName.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{companyName}</span>
              <Badge variant="secondary" className="bg-primary/90 text-primary-foreground text-xs">
                Ad
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Post Image - Show Original in Modal */}
          <ImageDisplayComponent
            imageUrl={post.image_original_url || post.image_url}
            alt={post.title}
            className="max-w-full"
          />

          {/* Post Content */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {post.title}
            </h2>
            
            {post.description && (
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {post.description}
              </p>
            )}

            {/* Post Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Views</span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {post.views_count.toLocaleString()}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <MousePointer className="w-4 h-4" />
                  <span className="text-sm">Clicks</span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {post.click_count.toLocaleString()}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">Likes</span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {post.likes_count.toLocaleString()}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">CTR</span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {post.views_count > 0 ? ((post.click_count / post.views_count) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            </div>

            {/* Post Date */}
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="w-4 h-4" />
              <span>Published on {formatDate(post.created_at)}</span>
            </div>

            {/* Call to Action */}
            <div className="pt-4">
              <Button 
                onClick={onVisitSite}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Visit Website
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}