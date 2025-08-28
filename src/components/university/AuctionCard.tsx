
import React from 'react';
import { Clock, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Auction {
  id: string;
  title: string;
  description: string;
  starting_price: number;
  current_price: number;
  reserve_price: number;
  image_urls: string[];
  end_time: string;
  is_active: boolean;
  winner_id: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
  bid_count?: number;
}

interface AuctionCardProps {
  auction: Auction;
  onClick: () => void;
}

export default function AuctionCard({ auction, onClick }: AuctionCardProps) {
  const timeLeft = new Date(auction.end_time).getTime() - new Date().getTime();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));

  const imageUrl = auction.image_urls?.[0] || '/placeholder.svg';

  return (
    <div 
      className="post-card cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-48 bg-surface rounded-xl overflow-hidden mb-4">
        <img
          src={imageUrl}
          alt={auction.title}
          className="w-full h-full object-cover"
        />
        {timeLeft > 0 ? (
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-1 rounded-lg text-xs font-medium">
            {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`} left
          </div>
        ) : (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
            Ended
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-foreground text-lg">{auction.title}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2">{auction.description}</p>
        </div>

        {/* Price Info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Bid</p>
            <p className="text-xl font-bold text-primary">₹{auction.current_price}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Starting</p>
            <p className="text-sm font-medium text-foreground">₹{auction.starting_price}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm">{auction.bid_count || 0} bids</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {timeLeft > 0 ? 'Active' : 'Ended'}
            </span>
          </div>
        </div>

        {/* Seller */}
        {auction.profiles && (
          <div className="flex items-center gap-2 pt-2">
            <img
              src={auction.profiles.avatar_url || '/placeholder.svg'}
              alt={auction.profiles.full_name}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm text-muted-foreground">
              {auction.profiles.full_name || auction.profiles.username}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
