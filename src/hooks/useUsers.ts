
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  university: string;
  major: string;
  bio: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, full_name, avatar_url, university, major, bio, user_type, followers_count, following_count, banner_url, created_at, updated_at')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(10);
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getUserById = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, full_name, avatar_url, university, major, bio, user_type, followers_count, following_count, banner_url, created_at, updated_at')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  return {
    users,
    loading,
    searchUsers,
    getUserById
  };
};
