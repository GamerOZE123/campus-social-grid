import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Gavel } from 'lucide-react';

interface ListingTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'sell' | 'auction') => void;
}

export default function ListingTypeModal({ isOpen, onClose, onSelectType }: ListingTypeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Listing Type</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-16 flex items-center justify-start gap-4 p-6"
            onClick={() => onSelectType('sell')}
          >
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Sell Item</h3>
              <p className="text-sm text-muted-foreground">Set a fixed price for your item</p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-full h-16 flex items-center justify-start gap-4 p-6"
            onClick={() => onSelectType('auction')}
          >
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Gavel className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Create Auction</h3>
              <p className="text-sm text-muted-foreground">Let buyers bid on your item</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}