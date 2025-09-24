import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateAdvertisingPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

export default function CreateAdvertisingPostModal({
  open,
  onOpenChange,
  onPostCreated
}: CreateAdvertisingPostModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !imageFile || !title.trim() || !redirectUrl.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select an image.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setProcessingStatus("Processing image...");
    
    try {
      // Process image using the new edge function
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('userId', user.id);
      formData.append('type', 'advertising');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No auth session');

      const response = await supabase.functions.invoke('process-image', {
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      
      const { imageUrls } = response.data;
      
      setProcessingStatus("Saving post...");

      // Create advertising post with all image URLs
      const { error: insertError } = await supabase
        .from('advertising_posts')
        .insert({
          company_id: user.id,
          title: title.trim(),
          description: description.trim(),
          image_url: imageUrls.original, // Keep for backwards compatibility
          image_thumbnail_url: imageUrls.thumbnail,
          image_medium_url: imageUrls.medium,
          image_original_url: imageUrls.original,
          redirect_url: redirectUrl.trim()
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Advertising post created successfully!"
      });

      // Reset form
      setTitle('');
      setDescription('');
      setRedirectUrl('');
      setImageFile(null);
      setImagePreview(null);
      onOpenChange(false);
      onPostCreated();
    } catch (error) {
      console.error('Error creating advertising post:', error);
      toast({
        title: "Error",
        description: "Failed to create advertising post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setProcessingStatus(null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Advertising Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Image *</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload an image
                </p>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image')?.click()}
                >
                  Choose Image
                </Button>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter advertising post title"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter post description (optional)"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Redirect URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Website URL *</Label>
            <Input
              id="url"
              type="url"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (processingStatus || "Creating...") : "Create Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}