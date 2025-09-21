import React, { useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from '@/components/ui/carousel';
import ImageModal from './ImageModal';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MultipleImageDisplayProps {
  imageUrls: string[];
  className?: string;
  onLike?: (e?: React.MouseEvent) => void;
  onComment?: (e?: React.MouseEvent) => void;
  onShare?: () => void;
  isLiked?: boolean;
  likesCount?: number;
  commentsCount?: number;
  postId?: string;
  postContent?: string;
}

const isImageUrl = (url: string) => {
  return (
    url.includes('placeholder.com') ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  );
};

const isPlaceholder = (url: string) => {
  return url.startsWith('uploading-');
};

const getImageAspectRatio = (url: string): number => {
  return 16/9; // Default aspect ratio
};

const shouldConstrainImage = (actualRatio: number): boolean => {
  // On mobile, constrain both very wide and very tall images
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return actualRatio >= 16/9 || actualRatio <= 9/16; // Wide or tall images
  }
  // On desktop, only constrain very tall images
  return actualRatio < (9/16);
};

const getDisplayAspectRatio = (actualRatio: number): number => {
  // On mobile, constrain extreme ratios
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    if (actualRatio >= 16/9) {
      return 4/3; // Constrain wide images
    }
    if (actualRatio <= 9/16) {
      return 3/4; // Constrain portrait images to 3:4 max
    }
  }
  // On desktop, only constrain very tall images
  if (actualRatio < (9/16)) {
    return 3/4;
  }
  return actualRatio;
};

export default function MultipleImageDisplay({ 
  imageUrls, 
  className = '', 
  onLike, 
  onComment, 
  onShare, 
  isLiked = false, 
  likesCount = 0, 
  commentsCount = 0,
  postId = '',
  postContent = ''
}: MultipleImageDisplayProps) {
  const [showFullImage, setShowFullImage] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  React.useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setShowFullImage(true);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedImageIndex((prev) => 
        prev === 0 ? imageUrls.length - 1 : prev - 1
      );
    } else {
      setSelectedImageIndex((prev) => 
        prev === imageUrls.length - 1 ? 0 : prev + 1
      );
    }
  };

  if (!imageUrls || imageUrls.length === 0) return null;

  // Single image display
  if (imageUrls.length === 1) {
    const imageUrl = imageUrls[0];
    const aspectRatio = getImageAspectRatio(imageUrl);
    
    return (
      <>
        <div className={`w-full max-w-lg ${className}`} data-image-container>
          {isPlaceholder(imageUrl) ? (
            <ImagePlaceholder status="loading" className="max-w-lg" />
          ) : shouldConstrainImage(aspectRatio) ? (
            <AspectRatio 
              ratio={getDisplayAspectRatio(aspectRatio)} 
              className="rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => handleImageClick(0)}
            >
              <img
                src={imageUrl}
                alt="Post content"
                className="w-full h-full object-cover"
              />
            </AspectRatio>
          ) : (
            <img
              src={imageUrl}
              alt="Post content"
              className="w-full h-auto object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => handleImageClick(0)}
            />
          )}
        </div>
        
        {!isPlaceholder(imageUrl) && (
          <ImageModal
            imageUrl={imageUrl}
            isOpen={showFullImage}
            onClose={() => setShowFullImage(false)}
            alt="Post content"
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            isLiked={isLiked}
            likesCount={likesCount}
            commentsCount={commentsCount}
          />
        )}
      </>
    );
  }

  // Multiple images carousel
  return (
    <>
      <div className={`w-full max-w-lg ${className}`} data-image-container>
        <Carousel 
          setApi={setApi} 
          className="w-full"
          opts={{
            align: "start",
            loop: false,
          }}
        >
          <CarouselContent>
            {imageUrls.map((imageUrl, index) => (
              <CarouselItem key={index}>
                <div className="relative">
                  {isPlaceholder(imageUrl) ? (
                    <ImagePlaceholder status="loading" />
                  ) : (
                    <AspectRatio 
                      ratio={getDisplayAspectRatio(getImageAspectRatio(imageUrl))} 
                      className="rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => handleImageClick(index)}
                    >
                      <img
                        src={imageUrl}
                        alt={`Post content ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </AspectRatio>
                  )}
                  
                  {/* Image counter */}
                  <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
                    {index + 1}/{imageUrls.length}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation arrows */}
          {imageUrls.length > 1 && (
            <>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 text-white border-none hover:bg-black/80" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 text-white border-none hover:bg-black/80" />
            </>
          )}
        </Carousel>
        
        {/* Dot indicators */}
        {imageUrls.length > 1 && (
          <div className="flex justify-center space-x-2 mt-3">
            {imageUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  current === index + 1 ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Full screen image modal with navigation */}
      {!isPlaceholder(imageUrls[selectedImageIndex]) && (
        <ImageModal
          imageUrl={imageUrls[selectedImageIndex]}
          isOpen={showFullImage}
          onClose={() => setShowFullImage(false)}
          alt={`Post content ${selectedImageIndex + 1}`}
          showNavigation={imageUrls.length > 1}
          onNavigate={navigateImage}
          currentIndex={selectedImageIndex + 1}
          totalImages={imageUrls.length}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
          isLiked={isLiked}
          likesCount={likesCount}
          commentsCount={commentsCount}
        />
      )}
    </>
  );
}