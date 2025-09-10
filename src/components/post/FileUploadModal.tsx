import React, { useState, useRef } from 'react';
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

interface UploadingImage {
  file: File;
  url?: string;
  uploaded: boolean;
}

export default function FileUploadModal({ isOpen, onClose, onPostCreated }: FileUploadModalProps) {
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (selectedFiles.length + files.length > 10) {
      toast.error('You can upload a maximum of 10 images');
      return;
    }

    const newFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setUploadingImages(prev => [
      ...prev,
      ...newFiles.map(file => ({ file, uploaded: false }))
    ]);
  };

  // Remove image
  const removeImage = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setUploadingImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Progressive uploads
  const uploadImages = async (files: File[], postId: string): Promise<string[]> => {
    return Promise.all(
      files.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${postId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('post-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        // Update progressive state
        setUploadingImages(prev =>
          prev.map((img, i) =>
            i === index ? { ...img, url: urlData.publicUrl, uploaded: true } : img
          )
        );

        return urlData.publicUrl;
      })
    );
  };

  // Handle final upload (post + images)
  const handleUpload = async () => {
    if (!user || (selectedFiles.length === 0 && !caption.trim())) {
      toast.error('Please add at least one image or caption');
      return;
    }

    setUploading(true);
    try {
      // Format hashtags
      const formattedHashtags = hashtags
        .filter(tag => tag.trim())
        .map(tag => tag.toLowerCase().replace(/^#+/, '').trim())
        .filter(tag => tag.length > 0);

      // Create post immediately
      const postData = {
        user_id: user.id,
        content: caption.trim() || 'New post',
        hashtags: formattedHashtags.length > 0 ? formattedHashtags : null,
        image_urls: null
      };

      const { data: post, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (error) throw error;

      toast.info('Uploading images...');

      // Upload images in parallel
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        imageUrls = await uploadImages(selectedFiles, post.id);

        // Update post with final image URLs
        await supabase
          .from('posts')
          .update({ image_urls: imageUrls })
          .eq('id', post.id);
      }

      toast.success('Post uploaded successfully!');

      // Reset form
      setSelectedFiles([]);
      setUploadingImages([]);
      setCaption('');
      setHashtags([]);

      // Notify parent and close
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
    setSelectedFiles([]);
    setUploadingImages([]);
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
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || selectedFiles.length >= 10}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Add Images ({selectedFiles.length}/10)
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

            {uploadingImages.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {uploadingImages.map((img, index) => (
                  <div key={index} className="relative flex-shrink-0 group">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-border flex items-center justify-center bg-muted">
                      {img.uploaded && img.url ? (
                        <img
                          src={img.url}
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <img
                            src={URL.createObjectURL(img.file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover opacity-50"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadingImages.length === 0 && (
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
              disabled={uploading || (selectedFiles.length === 0 && !caption.trim())}
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
