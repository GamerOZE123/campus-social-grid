
import React from 'react';
import { MoreHorizontal, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostHeaderProps {
  username: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
  isOwnPost?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PostHeader({ 
  username, 
  fullName, 
  avatarUrl, 
  createdAt, 
  isOwnPost = false, 
  onEdit, 
  onDelete 
}: PostHeaderProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
        <span className="text-sm font-bold text-white">
          {avatarUrl || fullName?.charAt(0) || username?.charAt(0) || 'U'}
        </span>
      </div>
      <div className="flex flex-col -mt-1"> {/* 👈 nudges text upward */}
        <div className="flex items-baseline gap-2">
          <p className="font-semibold text-foreground">{fullName || username}</p>
          <p className="text-sm text-muted-foreground">@{username}</p>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 -mt-1"> {/* 👈 keeps time aligned upward */}
      <span className="text-sm text-muted-foreground">{formatDate(createdAt)}</span>
      {isOwnPost && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Post
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete Post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  </div>
);
}
