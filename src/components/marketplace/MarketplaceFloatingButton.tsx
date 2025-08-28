import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ListingTypeModal from '@/components/university/ListingTypeModal';
import CreateMarketplaceItemModal from '@/components/university/CreateMarketplaceItemModal';
import CreateAuctionModal from '@/components/university/CreateAuctionModal';

interface MarketplaceFloatingButtonProps {
  onItemCreated: () => void;
  onAuctionCreated: () => void;
}

export default function MarketplaceFloatingButton({ onItemCreated, onAuctionCreated }: MarketplaceFloatingButtonProps) {
  const [showListingTypeModal, setShowListingTypeModal] = useState(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [showCreateAuctionModal, setShowCreateAuctionModal] = useState(false);

  const handleListingTypeSelect = (type: 'sell' | 'auction') => {
    setShowListingTypeModal(false);
    if (type === 'sell') {
      setShowCreateItemModal(true);
    } else {
      setShowCreateAuctionModal(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={() => setShowListingTypeModal(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <ListingTypeModal
        isOpen={showListingTypeModal}
        onClose={() => setShowListingTypeModal(false)}
        onSelectType={handleListingTypeSelect}
      />

      {showCreateItemModal && (
        <CreateMarketplaceItemModal
          onClose={() => setShowCreateItemModal(false)}
          onSuccess={() => {
            setShowCreateItemModal(false);
            onItemCreated();
          }}
        />
      )}

      {showCreateAuctionModal && (
        <CreateAuctionModal
          onClose={() => setShowCreateAuctionModal(false)}
          onSuccess={() => {
            setShowCreateAuctionModal(false);
            onAuctionCreated();
          }}
        />
      )}
    </>
  );
}