
import React from 'react';
import { Home, MessageCircle, User, Search, GraduationCap } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useChatContext } from '@/contexts/ChatContext';

const navigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Explore', href: '/explore', icon: Search },
  { name: 'University', href: '/university', icon: GraduationCap },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function MobileNavigation() {
  const location = useLocation();
  const { hasUnreadMessages } = useChatContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <item.icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                {item.name === 'Chat' && hasUnreadMessages && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-xs font-medium">{item.name}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
