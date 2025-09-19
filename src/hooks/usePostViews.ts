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

export const usePostViews = () => {
  const { user } = useAuth();
  const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set());

  const recordPostView = useCallback(async (postId: string) => {
    // Check if already viewed in this session
    if (viewedPosts.has(postId)) {
      return;
    }

    try {
      const sessionId = getSessionId();
      
      // Record the view in the database
      const { error } = await supabase
        .from('post_views')
        .insert({
          post_id: postId,
          user_id: user?.id || null,
          session_id: sessionId
        });

      if (error && !error.message.includes('duplicate key')) {
        console.error('Error recording post view:', error);
        return;
      }

      // Mark as viewed in session
      setViewedPosts(prev => new Set([...prev, postId]));
    } catch (error) {
      console.error('Error recording post view:', error);
    }
  }, [user?.id, viewedPosts]);

  return {
    recordPostView,
    viewedPosts
  };
};