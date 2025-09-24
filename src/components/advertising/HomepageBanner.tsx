import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  redirect_url: string;
}

interface HomepageBannerProps {
  onClose?: () => void;
  className?: string;
}

export default function HomepageBanner({ onClose, className = '' }: HomepageBannerProps) {
  const { user } = useAuth();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasViewed, setHasViewed] = useState(false);

  // Generate or get session ID
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  const fetchActiveBanner = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_banners')
        .select('id, title, image_url, redirect_url')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString().split('T')[0])
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setBanner(data);
    } catch (error) {
      console.error('Error fetching banner:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordView = async (bannerId: string) => {
    try {
      await supabase
        .from('homepage_banner_views')
        .insert({
          banner_id: bannerId,
          user_id: user?.id || null,
          session_id: getSessionId()
        });
    } catch (error) {
      console.error('Error recording banner view:', error);
    }
  };

  const handleClick = async () => {
    if (!banner) return;

    try {
      // Record click
      await supabase
        .from('homepage_banner_clicks')
        .insert({
          banner_id: banner.id,
          user_id: user?.id || null,
          ip_address: null, // Will be set by the trigger if needed
          user_agent: navigator.userAgent
        });

      // Open link in new tab
      window.open(banner.redirect_url, '_blank');
    } catch (error) {
      console.error('Error recording banner click:', error);
      // Still allow navigation even if tracking fails
      window.open(banner.redirect_url, '_blank');
    }
  };

  useEffect(() => {
    fetchActiveBanner();
  }, []);

  useEffect(() => {
    if (banner && !hasViewed && !loading) {
      // Record view after 1 second delay
      const timer = setTimeout(() => {
        recordView(banner.id);
        setHasViewed(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [banner, hasViewed, loading, user]);

  if (loading || !banner) {
    return null;
  }

  return (
    <div className={`relative bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border overflow-hidden ${className}`}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background rounded-full p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      <div
        onClick={handleClick}
        className="cursor-pointer block group"
      >
        <div className="flex items-center gap-4 p-4">
          <div className="flex-shrink-0">
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-16 h-16 object-cover rounded-lg group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {banner.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Sponsored content
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}