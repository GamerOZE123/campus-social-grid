
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
  condition: string;
  location: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

interface CreateMarketplaceItemModalProps {
  item?: MarketplaceItem;
  onClose: () => void;
  onSuccess: () => void;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export default function CreateMarketplaceItemModal({ item, onClose, onSuccess }: CreateMarketplaceItemModalProps) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    price: item?.price?.toString() || '',
    category_id: '',
    condition: item?.condition || '',
    location: item?.location || '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files].slice(0, 10)); // Max 10 images
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0 && item?.image_urls) {
      return item.image_urls;
    }

    const imageUrls: string[] = [];

    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `marketplace/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      imageUrls.push(publicUrl);
    }

    return imageUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const imageUrls = await uploadImages();

      const itemData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        condition: formData.condition,
        location: formData.location,
        image_urls: imageUrls,
      };

      if (item) {
        // Update existing item
        const { error } = await supabase
          .from('marketplace_items')
          .update(itemData)
          .eq('id', item.id);

        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase
          .from('marketplace_items')
          .insert({
            ...itemData,
            user_id: user.id,
            category_id: formData.category_id || null,
          });

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating/updating marketplace item:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {item ? 'Edit Item' : 'List New Item'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
              placeholder="Enter item title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground h-24"
              placeholder="Describe your item"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Condition</label>
              <select
                required
                value={formData.condition}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="">Select condition</option>
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          {!item && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Campus location"
                />
              </div>
            </div>
          )}

          {item && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                placeholder="Campus location"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Images (Max 10)</label>
            <div className="border-2 border-dashed border-border rounded-lg p-6">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {item ? 'Click to replace images' : 'Click to upload images'}
                </p>
              </label>
            </div>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {item && item.image_urls && item.image_urls.length > 0 && images.length === 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {item.image_urls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Current ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={uploading} className="flex-1">
              {uploading ? (item ? 'Updating...' : 'Creating...') : (item ? 'Update Item' : 'List Item')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
