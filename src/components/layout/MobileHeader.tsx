import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';

export default function MobileHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const isProfilePage = location.pathname.startsWith('/profile');
  const isExplorePage = location.pathname.startsWith('/explore');
  const isChatPage = location.pathname.startsWith('/chat');
  const isPostPage = location.pathname.startsWith('/post');

  return (
    <div
      className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{ paddingTop: '10px', paddingBottom: '8px' }}
    >
      <div className="flex items-center gap-4">
        {(isProfilePage || isExplorePage || isChatPage || isPostPage) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="p-2"
            aria-label="Back to Home"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-xl font-bold text-foreground">
          {isProfilePage
            ? 'Profile'
            : isExplorePage
            ? 'Explore'
            : isChatPage
            ? 'Chat'
            : isPostPage
            ? 'Post'
            : 'Unigramm'}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/notifications')}
          className="p-2 relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold sr-only">{unreadCount}</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
