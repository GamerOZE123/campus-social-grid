
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import HashtagSelector from './HashtagSelector';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function FileUploadModal({ isOpen, onClose, onPostCreated }: FileUploadModalProps) {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type - support PNG, JPEG, and JPG
      if (!file.type.startsWith('image/') || (!file.type.includes('jpeg') && !file.type.includes('jpg') && !file.type.includes('png'))) {
        toast.error('Please select a valid PNG, JPEG, or JPG image file');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const optimizeAndUploadImage = async (file: File): Promise<string | null> => {
    try {
      // Create a canvas to optimize the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = async () => {
          // Calculate new dimensions for better sizing - reduce portrait image sizes
          const maxWidth = 800; // Reduced max width for better sizing
          const maxHeight = 600; // Reduced max height especially for portraits
          let { width, height } = img;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress the image
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Determine output format and quality based on input and file size
          const outputFormat = file.type.includes('png') ? 'image/png' : 'image/jpeg';
          let quality = 0.8; // Default quality
          
          // Adjust quality based on original file size for better compression
          if (file.size > 20 * 1024 * 1024) { // > 20MB
            quality = 0.6;
          } else if (file.size > 10 * 1024 * 1024) { // > 10MB
            quality = 0.7;
          } else if (file.type.includes('png')) {
            quality = 0.9; // PNG generally needs higher quality
          }
          
          canvas.toBlob(async (blob) => {
            if (!blob) {
              resolve(null);
              return;
            }

            // Get the correct file extension - support jpg, jpeg, and png
            let fileExt = 'jpg';
            if (file.type.includes('png')) {
              fileExt = 'png';
            } else if (file.type.includes('jpeg') || file.type.includes('jpg')) {
              fileExt = 'jpg';
            }
            
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `posts/${fileName}`;

            console.log('Uploading optimized image to storage...', {
              originalSize: file.size,
              compressedSize: blob.size,
              format: outputFormat,
              quality
            });
            
            const { data, error } = await supabase.storage
              .from('post-images')
              .upload(filePath, blob, {
                cacheControl: '3600',
                upsert: false,
                contentType: outputFormat
              });

            if (error) {
              console.error('Storage upload error:', error);
              toast.error('Failed to upload image');
              resolve(null);
              return;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('post-images')
              .getPublicUrl(filePath);

            console.log('Image uploaded successfully:', publicUrl);
            resolve(publicUrl);
          }, outputFormat, quality);
        };

        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('Error optimizing and uploading image:', error);
      return null;
    }
  };

  const handleUpload = async () => {
    if (!user || (!selectedImage && !caption.trim())) {
      toast.error('Please add an image or caption');
      return;
    }

    setUploading(true);
    try {
      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        imageUrl = await optimizeAndUploadImage(selectedImage);
        
        if (!imageUrl) {
          toast.error('Failed to upload image');
          setUploading(false);
          return;
        }
      }

      // Prepare hashtags - ensure they're properly formatted and not empty
      const formattedHashtags = hashtags
        .filter(tag => tag.trim())
        .map(tag => tag.toLowerCase().replace(/^#+/, '').trim())
        .filter(tag => tag.length > 0);

      console.log('Creating post with hashtags:', formattedHashtags);

      // Create the post with hashtags
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: caption.trim() || 'New post',
          image_url: imageUrl,
          hashtags: formattedHashtags.length > 0 ? formattedHashtags : null
        })
        .select();

      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }

      console.log('Post created successfully with hashtags:', data);
      toast.success('Post uploaded successfully!');
      
      // Reset form
      setSelectedImage(null);
      setImagePreview(null);
      setCaption('');
      setHashtags([]);
      
      // Notify parent and close modal
      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Error uploading post:', error);
      toast.error('Failed to upload post');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCaption('');
    setHashtags([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Create New Post
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Image Upload Section */}
          <div className="border-2 border-dashed border-muted rounded-lg p-6">
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-4">Select a PNG, JPEG, or JPG image to upload</p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  Choose Image
                </Button>
              </div>
            )}
          </div>

          {/* Caption Section */}
          <div>
            <Textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Hashtags Section */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Add Hashtags
            </label>
            <HashtagSelector hashtags={hashtags} onHashtagsChange={setHashtags} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploading || !caption.trim()}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
