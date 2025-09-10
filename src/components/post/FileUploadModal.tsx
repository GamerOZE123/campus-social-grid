
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import HashtagSelector from './HashtagSelector';
import { MultipleImageUpload } from '@/components/ui/multiple-image-upload';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function FileUploadModal({ isOpen, onClose, onPostCreated }: FileUploadModalProps) {
  const { user } = useAuth();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!user || (imageUrls.length === 0 && !caption.trim())) {
      toast.error('Please add at least one image or caption');
      return;
    }

    setUploading(true);
    try {

      // Prepare hashtags - ensure they're properly formatted and not empty
      const formattedHashtags = hashtags
        .filter(tag => tag.trim())
        .map(tag => tag.toLowerCase().replace(/^#+/, '').trim())
        .filter(tag => tag.length > 0);

      console.log('Creating post with hashtags:', formattedHashtags);

      // Create the post with hashtags and multiple images
      const postData: any = {
        user_id: user.id,
        content: caption.trim() || 'New post',
        hashtags: formattedHashtags.length > 0 ? formattedHashtags : null
      };

      // Always use image_urls array for all images
      if (imageUrls.length > 0) {
        postData.image_urls = imageUrls;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select();

      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }

      console.log('Post created successfully with hashtags:', data);
      toast.success('Post uploaded successfully!');
      
      // Reset form
      setImageUrls([]);
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
    setImageUrls([]);
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
          <MultipleImageUpload
            onImagesUploaded={setImageUrls}
            maxImages={10}
            bucketName="post-images"
          />

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
              disabled={uploading || (imageUrls.length === 0 && !caption.trim())}
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
