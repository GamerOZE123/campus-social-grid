import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RecentChat {
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  other_user_university: string;
  last_interacted_at: string;
  deleted_at?: string | null; // Ensure deleted_at is included
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
        target_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching recent chats:', JSON.stringify(error, null, 2));
        throw error;
      }

      // Log raw data to inspect deleted_at
      console.log('Raw recent chats from RPC:', data);

      // Filter out chats where deleted_at is not null
      const filteredChats = (data || []).filter(
        (chat: RecentChat) => !chat.deleted_at
      );

      console.log('Filtered recent chats:', filteredChats);
      setRecentChats(filteredChats);
    } catch (error) {
      console.error('Error fetching recent chats:', JSON.stringify(error, null, 2));
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
        target_user_id: otherUserId,
      });

      if (error) {
        console.error('Error adding recent chat:', JSON.stringify(error, null, 2));
        throw error;
      }

      await fetchRecentChats();
    } catch (error) {
      console.error('Error adding recent chat:', JSON.stringify(error, null, 2));
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentChats();

      // Real-time listener for messages to update recent chats
      const messageChannel = supabase
        .channel('recent-chats-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            console.log('New message for recent chats:', payload);
            fetchRecentChats();
          }
        )
        .subscribe();

      // Real-time listener for recent_chats updates (e.g., deletions)
      const recentChatsChannel = supabase
        .channel('recent-chats-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'recent_chats',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Recent chats update:', payload);
            fetchRecentChats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
        supabase.removeChannel(recentChatsChannel);
      };
    }
  }, [user]);

  return {
    recentChats,
    loading,
    addRecentChat,
    refreshRecentChats: fetchRecentChats,
  };
};
