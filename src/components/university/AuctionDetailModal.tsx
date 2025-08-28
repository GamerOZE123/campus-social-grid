
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Clock, Users, TrendingUp, Gavel } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface Bid {
  id: string;
  amount: number;
  created_at: string;
  user_id: string;
}

interface AuctionDetailModalProps {
  auction: Auction;
  onClose: () => void;
  onBidPlaced: () => void;
}

export default function AuctionDetailModal({ auction, onClose, onBidPlaced }: AuctionDetailModalProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchBids();
  }, [auction.id]);

  const fetchBids = async () => {
    try {
      const { data: bidsData, error: bidsError } = await supabase
        .from('auction_bids')
        .select('id, amount, created_at, user_id')
        .eq('auction_id', auction.id)
        .order('amount', { ascending: false });

      if (bidsError) throw bidsError;

      setBids(bidsData || []);
    } catch (error) {
      console.error('Error fetching bids:', error);
      setBids([]);
    }
  };

  const handleBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= auction.current_price) {
      alert('Bid must be higher than current price');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('auction_bids')
        .insert({
          auction_id: auction.id,
          user_id: user.id,
          amount: parseFloat(bidAmount)
        });

      if (error) throw error;

      setBidAmount('');
      fetchBids();
      onBidPlaced();
    } catch (error) {
      console.error('Error placing bid:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeLeft = new Date(auction.end_time).getTime() - new Date().getTime();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left side - Image */}
          <div className="flex-1 relative">
            <img
              src={auction.image_urls?.[currentImageIndex] || '/placeholder.svg'}
              alt={auction.title}
              className="w-full h-64 lg:h-[600px] object-cover"
            />
            
            {/* Image navigation */}
            {auction.image_urls && auction.image_urls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {auction.image_urls.map((_, index) => (
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

            {/* Price overlay */}
            <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 lg:p-4 rounded-xl">
              <p className="text-xs lg:text-sm opacity-90">Current Bid</p>
              <p className="text-xl lg:text-3xl font-bold">₹{auction.current_price}</p>
            </div>
          </div>

          {/* Right side - Details and bidding */}
          <div className="w-full lg:w-96 p-4 lg:p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="text-lg lg:text-xl font-bold text-foreground line-clamp-2">{auction.title}</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Time left */}
            <div className="bg-surface rounded-xl p-4 mb-4 lg:mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Time Remaining</span>
              </div>
              {timeLeft > 0 ? (
                <p className="text-base lg:text-lg font-bold text-primary">
                  {hoursLeft}h {minutesLeft}m
                </p>
              ) : (
                <p className="text-base lg:text-lg font-bold text-red-500">Auction Ended</p>
              )}
            </div>

            {/* Description */}
            <div className="mb-4 lg:mb-6">
              <p className="text-sm lg:text-base text-muted-foreground">{auction.description}</p>
            </div>

            {/* Bidding section */}
            {timeLeft > 0 && (
              <div className="bg-surface rounded-xl p-4 mb-4 lg:mb-6">
                <h3 className="font-semibold text-foreground mb-3">Place a Bid</h3>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Min: ₹${auction.current_price + 0.01}`}
                    className="flex-1"
                  />
                  <Button onClick={handleBid} disabled={loading} className="flex items-center gap-2">
                    <Gavel className="w-4 h-4" />
                    Bid
                  </Button>
                </div>
              </div>
            )}

            {/* Recent bids */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="font-semibold text-foreground mb-3">Recent Bids ({bids.length})</h3>
              <div className="space-y-3">
                {bids.length > 0 ? (
                  bids.slice(0, 10).map((bid, index) => (
                    <div key={bid.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">#{index + 1}</span>
                        </div>
                        <span className="text-sm text-foreground">
                          Anonymous Bidder
                        </span>
                      </div>
                      <span className="text-sm font-medium text-primary">₹{bid.amount}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No bids yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
