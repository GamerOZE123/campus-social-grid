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
        target_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching recent chats:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('Fetched recent chats:', data);
      setRecentChats(data || []);
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

      await fetchRecentChats();  // Refresh list (restores if previously deleted)
    } catch (error) {
      console.error('Error adding recent chat:', JSON.stringify(error, null, 2));
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentChats();

      // Real-time: Refresh on new messages (Instagram: chat bubbles up/reappears)
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
            const message = payload.new;
            if (message.sender_id !== user.id && message.conversation_id) {
              // If new message from other user, refresh to restore/add chat
              fetchRecentChats();
            }
          }
        )
        .subscribe();

      // Real-time: Refresh on recent_chats updates (e.g., self-deletion)
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
