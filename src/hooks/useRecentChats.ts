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
  if (!user) {
    console.error('No authenticated user found');
    toast.error('Please log in to add a chat');
    return;
  }

  try {
    console.log('Adding recent chat:', { userId: user.id, otherUserId });

    // Fetch user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name, username, university, avatar_url')
      .eq('id', otherUserId)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user details:', userError?.message || 'No user data');
      toast.error('Failed to fetch user details');
      throw new Error(userError?.message || 'User not found');
    }

    const otherUserName = userData.full_name || userData.username || 'Unknown';
    const otherUserUniversity = userData.university || '';
    const otherUserAvatar = userData.avatar_url || '';

    console.log('User details fetched:', { otherUserName, otherUserUniversity, otherUserAvatar });

    // Call upsert_recent_chat RPC
    const { error: upsertError } = await supabase.rpc('upsert_recent_chat', {
      current_user_id: user.id,
      target_user_id: otherUserId,
      other_user_name: otherUserName,
      other_user_university: otherUserUniversity,
      other_user_avatar: otherUserAvatar,
    });

    if (upsertError) {
      console.error('Error upserting recent chat:', JSON.stringify(upsertError, null, 2));
      toast.error('Failed to add user to recent chats');
      throw upsertError;
    }

    console.log('Recent chat added successfully for user:', otherUserId);
    await fetchRecentChats(); // Refresh the list
  } catch (error) {
    console.error('Error in addRecentChat:', JSON.stringify(error, null, 2));
    toast.error('Failed to add recent chat');
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
            if (message.sender_id !== user.id) {
              console.log('New incoming message, refreshing recent chats');
              fetchRecentChats();  // Restore/add chat
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
