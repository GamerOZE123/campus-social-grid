import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ImageDisplayComponentProps {
  imageUrl: string;
  alt?: string;
  className?: string;
}

export default function ImageDisplayComponent({ 
  imageUrl, 
  alt = "Post image",
  className = "" 
}: ImageDisplayComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    
    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  return (
    <>
      {/* In-Feed Display - Fixed 16:9 Aspect Ratio */}
      <div className={`w-full max-w-md ${className}`}>
        <div 
          className="relative w-full aspect-video bg-muted rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
          onClick={openModal}
        >
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>

      {/* Full-Screen Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-60 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Modal Image - Centered and Fit to Screen */}
          <div 
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Click outside overlay */}
          <div 
            className="absolute inset-0 -z-10"
            onClick={closeModal}
            aria-label="Close modal"
          />
        </div>
      )}
    </>
  );
}