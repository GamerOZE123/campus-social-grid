
import React from 'react';
import { Heart, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface MarketplaceItemCardProps {
  item: MarketplaceItem;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onShowDetails: () => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export default function MarketplaceItemCard({
  item,
  isFavorited,
  onToggleFavorite,
  onShowDetails,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: MarketplaceItemCardProps) {
  const imageUrl = item.image_urls?.[0] || '/placeholder.svg';

  return (
    <div className="bg-white dark:bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
      {/* Image */}
      <div className="relative h-80 bg-surface">
        <img
          src={imageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        
        {/* Navigation Arrows */}
        {canGoPrevious && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90 text-foreground rounded-full p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        
        {canGoNext && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90 text-foreground rounded-full p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFavorite}
            className={`rounded-full p-2 bg-white/80 hover:bg-white/90 ${
              isFavorited ? 'text-red-500' : 'text-muted-foreground'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowDetails}
            className="rounded-full p-2 bg-white/80 hover:bg-white/90 text-foreground"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>

        {/* Condition Badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-primary text-primary-foreground px-2 py-1 rounded-lg text-xs font-medium">
            {item.condition?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-foreground mb-1">{item.title}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-primary">
            ₹{item.price}
          </div>
          {item.location && (
            <div className="text-sm text-muted-foreground">
              📍 {item.location}
            </div>
          )}
        </div>

        {/* Seller Info */}
        {item.profiles && (
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <img
              src={item.profiles.avatar_url || '/placeholder.svg'}
              alt={item.profiles.full_name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {item.profiles.full_name || item.profiles.username}
              </p>
              <p className="text-xs text-muted-foreground">Seller</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
