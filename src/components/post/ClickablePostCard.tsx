import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ClickablePostCardProps {
  postId: string;
  children: React.ReactNode;
  className?: string;
}

export default function ClickablePostCard({ postId, children, className = "" }: ClickablePostCardProps) {
  const navigate = useNavigate();

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements or links
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea')) {
      return;
    }
    navigate(`/post/${postId}`);
  };

  return (
    <div 
      onClick={handlePostClick}
      className={`
        cursor-pointer transition-colors 
        hover:bg-muted/5 
        ${className}

        // ✅ Fullscreen post on mobile
        sm:w-full sm:h-auto 

        // ✅ Normal contained post on desktop
        md:w-auto md:max-w-2xl md:mx-auto
      `}
    >
      {children}
    </div>
  );
}
