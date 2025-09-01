
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RecentChat {
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  other_user_university: string;
  last_interacted_at: string;
}

export const useRecentChats = () => {
  const { user } = useAuth();
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentChats = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching recent chats for user:', user.id);
      const { data, error } = await supabase.rpc('get_recent_chats', {
        target_user_id: user.id
      });
      
      if (error) {
        console.error('Error fetching recent chats:', error);
        throw error;
      }
      
      console.log('Fetched recent chats:', data);
      setRecentChats(data || []);
    } catch (error) {
      console.error('Error fetching recent chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRecentChat = async (otherUserId: string) => {
    if (!user) return;
    
    try {
      console.log('Adding recent chat:', { userId: user.id, otherUserId });
      const { error } = await supabase.rpc('upsert_recent_chat', {
        current_user_id: user.id,
        target_user_id: otherUserId
      });
      
      if (error) {
        console.error('Error adding recent chat:', error);
        throw error;
      }
      
      await fetchRecentChats();
    } catch (error) {
      console.error('Error adding recent chat:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentChats();
    }
  }, [user]);

  return {
    recentChats,
    loading,
    addRecentChat,
    refreshRecentChats: fetchRecentChats
  };
};
