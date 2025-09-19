
import React, { useState, useRef, useEffect } from 'react';
import { Search, MessageCircle, MoreVertical, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserSearchProps {
  onStartChat: (userId: string) => void;
  onToggleDeleteMode?: () => void;
  deleteMode?: boolean;
}

export default function UserSearch({ onStartChat, onToggleDeleteMode, deleteMode = false }: UserSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const { users, loading, searchUsers } = useUsers();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim()) {
      debounceRef.current = setTimeout(() => {
        searchUsers(query.trim());
        setShowResults(true);
      }, 800);
    } else {
      setShowResults(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserClick = (selectedUser: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) {
      // On mobile, clicking anywhere on the user should start chat
      handleStartChat(selectedUser.user_id, e);
    } else {
      // On desktop, maintain original behavior - go to profile
      navigate(`/profile/${selectedUser.user_id}`);
      setShowResults(false);
      setQuery('');
    }
  };

  const handleStartChat = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await onStartChat(userId);
    setShowResults(false);
    setQuery('');
  };

  // Filter out current user from search results
  const filteredUsers = users.filter(searchUser => searchUser.user_id !== user?.id);

  return (
    <div className="relative" ref={searchRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search users to chat with..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-muted text-foreground placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        {isMobile && onToggleDeleteMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onToggleDeleteMode}>
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteMode ? 'Cancel Delete' : 'Delete Users'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {showResults && (
        <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg mt-1 shadow-lg z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Searching users...
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((searchUser) => (
              <div
                key={searchUser.id}
                className="p-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={(e) => handleUserClick(searchUser, e)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center overflow-hidden">
                      {searchUser.avatar_url ? (
                        <img src={searchUser.avatar_url} alt={searchUser.full_name || searchUser.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {searchUser.full_name?.charAt(0) || searchUser.username?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{searchUser.full_name || searchUser.username}</p>
                      <p className="text-sm text-muted-foreground">@{searchUser.username}</p>
                      {searchUser.university && <p className="text-xs text-muted-foreground">{searchUser.university}</p>}
                    </div>
                  </div>
                  {!isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleStartChat(searchUser.user_id, e)}
                      className="ml-2 hover:bg-primary/10"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : query.trim() ? (
            <div className="p-4 text-center text-muted-foreground">No users found</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
