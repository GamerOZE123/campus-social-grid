
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Heart, MapPin, Clock } from 'lucide-react';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
  condition: string;
  location: string;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

interface ItemDetailModalProps {
  item: MarketplaceItem;
  onClose: () => void;
}

export default function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex">
          {/* Left side - Images */}
          <div className="flex-1 relative">
            <img
              src={item.image_urls?.[currentImageIndex] || '/placeholder.svg'}
              alt={item.title}
              className="w-full h-[600px] object-cover"
            />
            
            {/* Image navigation */}
            {item.image_urls && item.image_urls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {item.image_urls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Condition badge */}
            <div className="absolute top-4 left-4">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm font-medium">
                {item.condition?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Right side - Details */}
          <div className="w-96 p-6 flex flex-col justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">{item.title}</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Price */}
              <div className="mb-6">
                <p className="text-3xl font-bold text-primary">₹{item.price}</p>
              </div>

              {/* Location and Date */}
              <div className="flex flex-col gap-2 mb-6 text-muted-foreground">
                {item.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{item.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Listed {formatDate(item.created_at)}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-auto">
              <Button variant="outline" className="w-full" size="lg">
                <Heart className="w-4 h-4 mr-2" />
                Save to Favorites
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
