import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  image_medium_url?: string;
  redirect_url: string;
  company_id: string;
}

interface HomepageBannerProps {
  onClose?: () => void;
  className?: string;
}

// Generate session ID for tracking
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

export default function HomepageBanner({ onClose, className }: HomepageBannerProps) {
  const { user } = useAuth();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewRecorded, setViewRecorded] = useState(false);

  useEffect(() => {
    fetchActiveBanner();
  }, []);

  const fetchActiveBanner = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_banners')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${new Date().toISOString().split('T')[0]}`)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setBanner(data[0]);
      }
    } catch (error) {
      console.error('Error fetching banner:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordView = async () => {
    if (!banner || viewRecorded) return;

    try {
      const sessionId = getSessionId();
      
      await supabase
        .from('homepage_banner_views')
        .insert({
          banner_id: banner.id,
          user_id: user?.id || null,
          session_id: sessionId
        });

      setViewRecorded(true);
    } catch (error) {
      console.error('Error recording banner view:', error);
    }
  };

  const handleClick = async () => {
    if (!banner) return;

    try {
      // Track the click
      await supabase
        .from('homepage_banner_clicks')
        .insert({
          banner_id: banner.id,
          user_id: user?.id || null,
          ip_address: null,
          user_agent: navigator.userAgent
        });

      // Open the URL in a new tab
      window.open(banner.redirect_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error tracking banner click:', error);
      // Still redirect even if tracking fails
      window.open(banner.redirect_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Record view when banner becomes visible
  useEffect(() => {
    if (banner && !viewRecorded) {
      const timer = setTimeout(recordView, 1000); // Record view after 1 second
      return () => clearTimeout(timer);
    }
  }, [banner, viewRecorded]);

  if (loading || !banner) {
    return null;
  }

  return (
    <div className={`relative bg-gradient-to-r from-primary/10 to-accent/10 border rounded-lg overflow-hidden ${className}`}>
      {/* Close Button */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 h-6 w-6 bg-background/80 hover:bg-background"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      {/* Banner Content */}
      <div 
        className="cursor-pointer p-4 flex items-center gap-4 min-h-[80px]"
        onClick={handleClick}
      >
        {/* Banner Image */}
        <div className="flex-shrink-0">
          <img
            src={banner.image_medium_url || banner.image_url}
            alt={banner.title}
            className="w-16 h-16 object-cover rounded-lg"
          />
        </div>

        {/* Banner Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {banner.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
              Sponsored
            </span>
            <span className="text-xs text-muted-foreground">
              Click to visit website
            </span>
          </div>
        </div>

        {/* Arrow Indicator */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <svg 
              className="w-4 h-4 text-primary" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}