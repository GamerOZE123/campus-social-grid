
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
    // Don't navigate if clicking on interactive elements or images
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, img')) {
      return;
    }
    
    navigate(`/post/${postId}`);
  };

  return (
    <div 
      onClick={handlePostClick}
      className={`cursor-pointer hover:bg-muted/5 transition-colors ${className}`}
    >
      {children}
    </div>
  );
}
