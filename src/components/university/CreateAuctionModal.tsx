
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Upload, Calendar, DollarSign } from 'lucide-react';
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

interface CreateAuctionModalProps {
  auction?: Auction;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAuctionModal({ auction, onClose, onSuccess }: CreateAuctionModalProps) {
  const [formData, setFormData] = useState({
    title: auction?.title || '',
    description: auction?.description || '',
    starting_price: auction?.starting_price?.toString() || '',
    reserve_price: auction?.reserve_price?.toString() || '',
    duration_hours: '24'
  });
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files).slice(0, 10)); // Max 10 images
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload new images if any
      let imageUrls: string[] = auction?.image_urls || [];
      if (images.length > 0) {
        imageUrls = [];
        for (const image of images) {
          const fileName = `${user.id}/${Date.now()}.${image.name.split('.').pop()}`;
          const { data, error } = await supabase.storage
            .from('posts')
            .upload(fileName, image);

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(data.path);

          imageUrls.push(publicUrl);
        }
      }

      const auctionData = {
        title: formData.title,
        description: formData.description,
        starting_price: parseFloat(formData.starting_price),
        reserve_price: formData.reserve_price ? parseFloat(formData.reserve_price) : null,
        image_urls: imageUrls,
      };

      if (auction) {
        // Update existing auction
        const { error } = await supabase
          .from('auctions')
          .update(auctionData)
          .eq('id', auction.id);

        if (error) throw error;
      } else {
        // Create new auction
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + parseInt(formData.duration_hours));

        const { error } = await supabase
          .from('auctions')
          .insert({
            user_id: user.id,
            ...auctionData,
            current_price: parseFloat(formData.starting_price),
            end_time: endTime.toISOString(),
            is_active: true
          });

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating/updating auction:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {auction ? 'Edit Auction' : 'Create Auction'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="What are you auctioning?"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your item..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="starting_price">Starting Price (₹)</Label>
              <Input
                id="starting_price"
                name="starting_price"
                type="number"
                step="0.01"
                value={formData.starting_price}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="reserve_price">Reserve Price (₹)</Label>
              <Input
                id="reserve_price"
                name="reserve_price"
                type="number"
                step="0.01"
                value={formData.reserve_price}
                onChange={handleInputChange}
                placeholder="Optional"
              />
            </div>
          </div>

          {!auction && (
            <div>
              <Label htmlFor="duration_hours">Duration (hours)</Label>
              <select
                id="duration_hours"
                name="duration_hours"
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="1">1 hour</option>
                <option value="6">6 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="72">72 hours</option>
                <option value="168">1 week</option>
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="images">Images</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              <input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label htmlFor="images" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {auction ? 'Click to replace images' : 'Click to upload images'}
                </p>
              </label>
              {images.length > 0 && (
                <p className="text-sm text-primary mt-2">{images.length} image(s) selected</p>
              )}
              {auction && auction.image_urls && auction.image_urls.length > 0 && images.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {auction.image_urls.length} existing image(s)
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={uploading} className="flex-1">
              {uploading ? (auction ? 'Updating...' : 'Creating...') : (auction ? 'Update Auction' : 'Create Auction')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
