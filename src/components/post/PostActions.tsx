
import React, { useState } from 'react';
import { Heart, MessageCircle, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ShareModal from './ShareModal';

interface PostActionsProps {
  likesCount: number;
  commentsCount: number;
  onLike?: (e?: React.MouseEvent) => void;
  onComment?: (e?: React.MouseEvent) => void;
  onShare?: () => void;
  isLiked?: boolean;
  likesLoading?: boolean;
  postId?: string;
  postContent?: string;
}

export default function PostActions({ 
  likesCount, 
  commentsCount, 
  isLiked = false, 
  onLike, 
  onComment,
  onShare,
  likesLoading = false,
  postId = '',
  postContent = ''
}: PostActionsProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      setShowShareModal(true);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => onLike(e)}
            disabled={likesLoading}
            className={cn(
              "flex items-center gap-2 hover:bg-muted/50",
              isLiked && "text-red-500 hover:text-red-600"
            )}
          >
            <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
            <span className="font-medium">{likesCount}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => onComment(e)}
            className="flex items-center gap-2 hover:bg-muted/50"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{commentsCount}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            className="flex items-center gap-2 hover:bg-muted/50"
          >
            <Share className="w-5 h-5" />
            <span className="font-medium">Share</span>
          </Button>
        </div>
      </div>

      {postId && (
        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          postId={postId}
          postContent={postContent}
        />
      )}
    </>
  );
}
