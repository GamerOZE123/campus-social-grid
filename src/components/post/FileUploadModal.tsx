'use client';

import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useUser } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState<
    { file: File; url?: string; uploaded: boolean }[]
  >([]);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const supabase = createClientComponentClient();
  const user = useUser();

  if (!isOpen) return null;

  /** Handle file selection */
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

  /** Remove a selected image */
  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadingImages(prev => prev.filter((_, i) => i !== index));
  };

  /** Upload each image and update progressive state */
  const uploadImages = async (files: File[]): Promise<string[]> => {
    return Promise.all(
      files.map(async file => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        const { error } = await supabase.storage
          .from('post-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        setUploadingImages(prev =>
          prev.map(img =>
            img.file === file ? { ...img, url: urlData.publicUrl, uploaded: true } : img
          )
        );

        return urlData.publicUrl;
      })
    );
  };

  /** Handle upload post with images */
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: create post immediately
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user?.id,
          caption,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Step 2: upload images in parallel
      const imageUrls = await uploadImages(selectedFiles);

      // Step 3: insert into post_images table
      await supabase.from('post_images').insert(
        imageUrls.map((url, index) => ({
          post_id: postData.id,
          image_url: url,
          order_index: index,
        }))
      );

      toast.success('Post uploaded successfully');

      // Reset and close modal
      setSelectedFiles([]);
      setUploadingImages([]);
      setCaption('');
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading post');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-lg w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Create Post</h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 hover:bg-muted rounded-full disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (scrollable if too tall) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Caption */}
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={e => setCaption(e.target.value)}
            className="w-full p-2 border border-border rounded-lg resize-none bg-background"
          />

          {/* Image Previews */}
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
                    disabled={isUploading}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* File Input */}
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition">
            <div className="flex flex-col items-center">
              <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </span>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
