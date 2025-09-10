
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import HashtagSelector from './HashtagSelector';
import { useProgressiveImageUpload } from '@/hooks/useProgressiveImageUpload';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function FileUploadModal({ isOpen, onClose, onPostCreated }: FileUploadModalProps) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    uploadStates,
    startUploads,
    retryUpload,
    getAllUrls,
    getCompletedUrls,
    reset: resetUploads
  } = useProgressiveImageUpload();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Start uploads and get placeholder IDs
    const placeholderIds = startUploads(Array.from(files));
    
    if (placeholderIds.length === 0) return;

    // Create post immediately with placeholders
    await createPostWithImages(placeholderIds);
  };

  const createPostWithImages = async (imageIds: string[]) => {
    if (!user) {
      toast.error('Please log in to create a post');
      return;
    }

    setUploading(true);
    try {
      // Prepare hashtags
      const formattedHashtags = hashtags
        .filter(tag => tag.trim())
        .map(tag => tag.toLowerCase().replace(/^#+/, '').trim())
        .filter(tag => tag.length > 0);

      // Create post with placeholder image IDs
      const postData = {
        user_id: user.id,
        content: caption.trim() || 'New post',
        hashtags: formattedHashtags.length > 0 ? formattedHashtags : null,
        image_urls: imageIds
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (error) throw error;

      setPostId(data.id);
      toast.success('Post created! Images are uploading...');
      
      // Start updating the post as images complete
      updatePostImages(data.id);
      
      // Notify parent and close modal
      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const updatePostImages = async (postId: string) => {
    // Set up interval to update post with completed images
    const updateInterval = setInterval(async () => {
      const completedUrls = getCompletedUrls();
      const allUrls = getAllUrls();
      
      // If we have some completed URLs, update the post
      if (completedUrls.length > 0) {
        try {
          const { error } = await supabase
            .from('posts')
            .update({ 
              image_urls: allUrls.map(url => 
                uploadStates.find(state => state.id === url && state.status === 'completed')?.url || url
              )
            })
            .eq('id', postId);

          if (error) {
            console.error('Error updating post images:', error);
          }
        } catch (error) {
          console.error('Error updating post:', error);
        }
      }

      // Check if all uploads are complete
      const allComplete = uploadStates.every(state => 
        state.status === 'completed' || state.status === 'error'
      );
      
      if (allComplete && uploadStates.length > 0) {
        clearInterval(updateInterval);
        const finalCompletedUrls = getCompletedUrls();
        if (finalCompletedUrls.length > 0) {
          toast.success('All images uploaded successfully!');
        }
      }
    }, 1000);

    // Clear interval after 5 minutes to prevent memory leaks
    setTimeout(() => clearInterval(updateInterval), 300000);
  };

  const handleUpload = () => {
    if (!user || (uploadStates.length === 0 && !caption.trim())) {
      toast.error('Please add at least one image or caption');
      return;
    }
    
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    resetUploads();
    setCaption('');
    setHashtags([]);
    setPostId(null);
    onClose();
  };

  const removeImage = (indexToRemove: number) => {
    // Note: For simplicity, we'll disable image removal once uploads start
    // In a full implementation, you'd want to cancel the upload and remove from state
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
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Add Images ({uploadStates.length}/10)
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {uploadStates.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadStates.map((uploadState, index) => (
                  <div key={uploadState.id} className="relative">
                    {uploadState.status === 'completed' && uploadState.url ? (
                      <div className="aspect-square rounded-lg overflow-hidden border border-border">
                        <img
                          src={uploadState.url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <ImagePlaceholder
                        status={uploadState.status === 'error' ? 'error' : 'uploading'}
                        progress={uploadState.progress}
                        onRetry={() => retryUpload(uploadState.id)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {uploadStates.length === 0 && (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No images selected yet</p>
                <p className="text-sm">Click "Add Images" to upload up to 10 photos</p>
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
              disabled={uploading || (uploadStates.length === 0 && !caption.trim())}
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
