import React from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { X, MoreHorizontal, Heart, MessageCircle, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  isLiked?: boolean;
  likesCount?: number;
  commentsCount?: number;
}

export default function ImageModal({ 
  imageUrl, 
  isOpen, 
  onClose, 
  alt = "Full size image",
  onLike,
  onComment,
  onShare,
  isLiked = false,
  likesCount = 0,
  commentsCount = 0
}: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 w-screen h-screen max-w-none max-h-none p-0 border-0 bg-black m-0 rounded-none">
        <div className="relative w-full h-full flex flex-col">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="bg-black/50 text-white hover:bg-black/70"
            >
              <X className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/50 text-white hover:bg-black/70"
            >
              <MoreHorizontal className="w-6 h-6" />
            </Button>
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 to-transparent p-6">
            <div className="flex items-center justify-center gap-12">
              <Button
                variant="ghost"
                size="lg"
                onClick={onLike}
                className="text-white hover:bg-white/10 flex flex-col items-center gap-1"
              >
                <Heart className={`w-7 h-7 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="text-sm">{likesCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={onComment}
                className="text-white hover:bg-white/10 flex flex-col items-center gap-1"
              >
                <MessageCircle className="w-7 h-7" />
                <span className="text-sm">{commentsCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={onShare}
                className="text-white hover:bg-white/10 flex flex-col items-center gap-1"
              >
                <Share className="w-7 h-7" />
                <span className="text-sm">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}