
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const activeUsers = [
  { id: 1, name: 'Lisa Wang', avatar: 'LW', online: true },
  { id: 2, name: 'Tom Brown', avatar: 'TB', online: true },
  { id: 3, name: 'Anna Lee', avatar: 'AL', online: false },
  { id: 4, name: 'David Kim', avatar: 'DK', online: true },
];

export default function UsersSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestedUsers();
  }, [user]);

  const fetchSuggestedUsers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, university, major, avatar_url')
        .neq('user_id', user.id)
        .limit(5);
      
      if (error) throw error;
      setSuggestedUsers(data || []);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <aside className="hidden xl:block fixed top-16 right-0 w-80 h-[calc(100vh-4rem)] overflow-y-auto bg-card border-l border-border p-6">
      {/* Suggested for You */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Suggested for You</h3>
          <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
            See All
          </Button>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-4">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            suggestedUsers.map((suggestedUser) => (
              <div key={suggestedUser.user_id} className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => handleUserClick(suggestedUser.user_id)}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center overflow-hidden">
                    {suggestedUser.avatar_url ? (
                      <img src={suggestedUser.avatar_url} alt={suggestedUser.full_name || suggestedUser.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {suggestedUser.full_name?.charAt(0) || suggestedUser.username?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {suggestedUser.full_name || suggestedUser.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {suggestedUser.university || suggestedUser.major || 'Student'}
                    </p>
                    <p className="text-xs text-muted-foreground">Suggested for you</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="btn-ghost">
                  <UserPlus className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Now */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Active Now</h3>
          <Button variant="ghost" size="icon" className="btn-ghost">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-3">
          {activeUsers.map((activeUser) => (
            <div key={activeUser.id} className="flex items-center gap-3 cursor-pointer hover:bg-surface rounded-lg p-2 transition-colors">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{activeUser.avatar}</span>
                </div>
                {activeUser.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-card rounded-full"></div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{activeUser.name}</p>
                <p className="text-xs text-muted-foreground">
                  {activeUser.online ? 'Active now' : 'Active 2h ago'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
