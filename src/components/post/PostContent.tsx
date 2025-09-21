import React, { useState } from "react";
import { File, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import ImageModal from "./ImageModal";

interface PostContentProps {
  content: string;
  imageUrl?: string;
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
    url.includes("placeholder.com") ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  );
};

const getImageAspectRatio = (url: string): Promise<number> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img.width / img.height);
    };
    img.onerror = () => {
      resolve(16/9); // Fallback ratio
    };
    img.src = url;
  });
};

const shouldConstrainImage = (actualRatio: number): boolean => {
  // Constrain very tall images (like phone screenshots) and very wide images
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    // Mobile: constrain tall images more aggressively
    return actualRatio > 2.5 || actualRatio < 0.6;
  }
  // Desktop: constrain very tall images
  return actualRatio < 0.6;
};

const getDisplayAspectRatio = (actualRatio: number): number => {
  // On mobile
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    if (actualRatio > 2.5) {
      return 16/9; // Constrain very wide images
    }
    if (actualRatio < 0.6) {
      return 3/4; // Constrain tall images (like phone screenshots)
    }
  }
  // On desktop
  if (actualRatio < 0.6) {
    return 9/16; // More constrained for very tall images on desktop
  }
  return actualRatio;
};

const getFileNameFromUrl = (url: string) => {
  if (url.includes("placeholder.com")) {
    const match = url.match(/text=(.+)/);
    return match ? decodeURIComponent(match[1]) : "File";
  }
  return url.split("/").pop() || "File";
};

export default function PostContent({ 
  content, 
  imageUrl, 
  onLike, 
  onComment, 
  onShare, 
  isLiked = false, 
  likesCount = 0, 
  commentsCount = 0,
  postId = '',
  postContent = ''
}: PostContentProps) {
  const [showFullImage, setShowFullImage] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  
  const handleDownload = () => {
    if (imageUrl) {
      window.open(imageUrl, "_blank");
    }
  };

  const handleImageClick = () => {
    setShowFullImage(true);
  };

  // Load image dimensions when imageUrl changes
  React.useEffect(() => {
    if (imageUrl && isImageUrl(imageUrl)) {
      getImageAspectRatio(imageUrl).then(setImageAspectRatio);
    }
  }, [imageUrl]);

  return (
    <div className="ml-14 mt-1 space-y-3">
      {/* Caption */}
      {content && (
        <p className="text-foreground leading-relaxed whitespace-pre-line break-words">
          {content}
        </p>
      )}

      {/* Image or file preview */}
      {imageUrl && (
        <div className="rounded-xl overflow-hidden" data-image-container>
          {isImageUrl(imageUrl) ? (
            <div className="w-full max-w-md">
              {imageAspectRatio && shouldConstrainImage(imageAspectRatio) ? (
                <AspectRatio 
                  ratio={getDisplayAspectRatio(imageAspectRatio)} 
                  className="rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity max-h-96"
                  onClick={handleImageClick}
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
                  className="w-full h-auto object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity max-h-96"
                  onClick={handleImageClick}
                  style={{ maxHeight: imageAspectRatio && imageAspectRatio < 0.6 ? '400px' : undefined }}
                />
              )}
            </div>
          ) : (
            <div className="bg-muted/20 border border-border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <File className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">
                    {getFileNameFromUrl(imageUrl)}
                  </p>
                  <p className="text-sm text-muted-foreground">Attached file</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Full size image modal */}
      {imageUrl && isImageUrl(imageUrl) && (
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
    </div>
  );
}
