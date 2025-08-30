import React, { useState } from "react";
import { File, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import ImageModal from "./ImageModal";

interface PostContentProps {
  content: string;
  imageUrl?: string;
}

const isImageUrl = (url: string) => {
  return (
    url.includes("placeholder.com") ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  );
};

const getImageAspectRatio = (url: string): number => {
  // This is a simplified version - in production you'd want to load the image to get actual dimensions
  // For demo purposes, we'll use some heuristics based on URL or assume common ratios
  return 16/9; // Default to 16:9, but this should be enhanced to detect actual image dimensions
};

const getDisplayAspectRatio = (actualRatio: number): number => {
  // If image is portrait (9:16 or similar), display as 4:3
  if (actualRatio < 1) {
    return 4/3;
  }
  // Otherwise use actual ratio, but constrain to common ratios
  if (actualRatio > 1.7) return 16/9; // Wide images
  if (actualRatio > 1.2) return 4/3;  // Standard images
  return 1; // Square images
};

const getFileNameFromUrl = (url: string) => {
  if (url.includes("placeholder.com")) {
    const match = url.match(/text=(.+)/);
    return match ? decodeURIComponent(match[1]) : "File";
  }
  return url.split("/").pop() || "File";
};

export default function PostContent({ content, imageUrl }: PostContentProps) {
  const [showFullImage, setShowFullImage] = useState(false);
  
  const handleDownload = () => {
    if (imageUrl) {
      window.open(imageUrl, "_blank");
    }
  };

  const handleImageClick = () => {
    setShowFullImage(true);
  };

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
        <div className="rounded-xl overflow-hidden">
          {isImageUrl(imageUrl) ? (
            <div className="w-full max-w-lg">
              <AspectRatio 
                ratio={getDisplayAspectRatio(getImageAspectRatio(imageUrl))} 
                className="rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
                onClick={handleImageClick}
              >
                <img
                  src={imageUrl}
                  alt="Post content"
                  className="w-full h-full object-cover"
                />
              </AspectRatio>
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
        />
      )}
    </div>
  );
}
