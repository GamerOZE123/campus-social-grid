import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Generate or get session ID for tracking anonymous views
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

export const useAdvertisingPostViews = () => {
  const { user } = useAuth();
  const [viewedAds, setViewedAds] = useState<Set<string>>(new Set());

  const recordAdvertisingPostView = useCallback(async (advertisingPostId: string) => {
    // Check if already viewed in this session
    if (viewedAds.has(advertisingPostId)) {
      return;
    }

    try {
      const sessionId = getSessionId();
      
      // Record the view in the database
      const { error } = await supabase
        .from('advertising_post_views')
        .insert({
          advertising_post_id: advertisingPostId,
          user_id: user?.id || null,
          session_id: sessionId
        });

      if (error && !error.message.includes('duplicate key')) {
        console.error('Error recording advertising post view:', error);
        return;
      }

      // Mark as viewed in session
      setViewedAds(prev => new Set([...prev, advertisingPostId]));
    } catch (error) {
      console.error('Error recording advertising post view:', error);
    }
  }, [user?.id, viewedAds]);

  return {
    recordAdvertisingPostView,
    viewedAds
  };
};