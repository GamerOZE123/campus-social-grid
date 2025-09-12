import React from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { X, MoreHorizontal, Heart, MessageCircle, Share, ChevronLeft, ChevronRight } from 'lucide-react';
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
  sharesCount?: number;
  showNavigation?: boolean;
  onNavigate?: (direction: 'prev' | 'next') => void;
  currentIndex?: number;
  totalImages?: number;
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
  commentsCount = 0,
  sharesCount = 0,
  showNavigation = false,
  onNavigate,
  currentIndex,
  totalImages
}: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/90" />
      <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 border-0 bg-black">
        <div className="relative w-full h-full flex flex-col">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-6 h-6" />
              </Button>
              {/* Image counter */}
              {showNavigation && currentIndex && totalImages && (
                <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {currentIndex} / {totalImages}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/50 text-white hover:bg-black/70"
            >
              <MoreHorizontal className="w-6 h-6" />
            </Button>
          </div>
          
          {/* Navigation buttons */}
          {showNavigation && onNavigate && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 text-white hover:bg-black/70"
                onClick={() => onNavigate('prev')}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 text-white hover:bg-black/70"
                onClick={() => onNavigate('next')}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center">
            <img
              src={imageUrl}
              alt={alt}
              className="
                w-full h-full object-contain
                sm:rounded-none sm:max-h-screen sm:max-w-screen
                md:rounded-lg md:max-h-[90vh] md:max-w-[95vw]
              "
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-center gap-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLike}
                className="text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="text-sm font-medium">{likesCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onComment}
                className="text-white hover:bg-white/10 flex items-center gap-2"
              >
                <MessageCircle className="w-6 h-6" />
                <span className="text-sm font-medium">{commentsCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onShare}
                className="text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Share className="w-6 h-6" />
                <span className="text-sm font-medium">{sharesCount}</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
