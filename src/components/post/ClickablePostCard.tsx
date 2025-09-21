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
    // Don't navigate if clicking on interactive elements, links, images, or image containers
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, img, [data-image-container]')) {
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
        w-full max-w-lg mx-auto
      `}
    >
      {children}
    </div>
  );
}
