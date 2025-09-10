import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export interface ImageUploadState {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

interface UseProgressiveImageUploadProps {
  bucketName?: string;
  maxImages?: number;
  compressionOptions?: {
    maxSizeMB: number;
    maxWidthOrHeight: number;
    useWebWorker: boolean;
  };
}

export const useProgressiveImageUpload = ({
  bucketName = 'post-images',
  maxImages = 10,
  compressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }
}: UseProgressiveImageUploadProps = {}) => {
  const [uploadStates, setUploadStates] = useState<ImageUploadState[]>([]);

  const compressImage = async (file: File): Promise<File> => {
    try {
      return await imageCompression(file, compressionOptions);
    } catch (error) {
      console.warn('Image compression failed, using original file:', error);
      return file;
    }
  };

  const uploadSingleImage = useCallback(async (
    imageState: ImageUploadState,
    onProgress: (id: string, progress: number) => void,
    onComplete: (id: string, url: string) => void,
    onError: (id: string, error: string) => void
  ) => {
    try {
      // Compress the image
      const compressedFile = await compressImage(imageState.file);
      
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload with progress tracking
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      onComplete(imageState.id, urlData.publicUrl);
    } catch (error) {
      console.error('Upload failed for image:', imageState.id, error);
      onError(imageState.id, error instanceof Error ? error.message : 'Upload failed');
    }
  }, [bucketName, compressionOptions]);

  const startUploads = useCallback((files: File[]): string[] => {
    if (files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return [];
    }

    // Create initial states with placeholder IDs
    const newUploadStates: ImageUploadState[] = files.map((file, index) => ({
      id: `uploading-${Date.now()}-${index}`,
      file,
      status: 'pending',
      progress: 0,
    }));

    setUploadStates(newUploadStates);

    // Start uploads in parallel
    newUploadStates.forEach((imageState) => {
      setUploadStates(prev => 
        prev.map(state => 
          state.id === imageState.id 
            ? { ...state, status: 'uploading' as const }
            : state
        )
      );

      uploadSingleImage(
        imageState,
        // onProgress
        (id, progress) => {
          setUploadStates(prev =>
            prev.map(state =>
              state.id === id ? { ...state, progress } : state
            )
          );
        },
        // onComplete
        (id, url) => {
          setUploadStates(prev =>
            prev.map(state =>
              state.id === id 
                ? { ...state, status: 'completed' as const, url, progress: 100 }
                : state
            )
          );
        },
        // onError
        (id, error) => {
          setUploadStates(prev =>
            prev.map(state =>
              state.id === id 
                ? { ...state, status: 'error' as const, error }
                : state
            )
          );
        }
      );
    });

    // Return placeholder IDs for immediate post creation
    return newUploadStates.map(state => state.id);
  }, [maxImages, uploadSingleImage]);

  const retryUpload = useCallback((imageId: string) => {
    const imageState = uploadStates.find(state => state.id === imageId);
    if (!imageState || imageState.status !== 'error') return;

    setUploadStates(prev =>
      prev.map(state =>
        state.id === imageId
          ? { ...state, status: 'uploading' as const, progress: 0, error: undefined }
          : state
      )
    );

    uploadSingleImage(
      imageState,
      // onProgress
      (id, progress) => {
        setUploadStates(prev =>
          prev.map(state =>
            state.id === id ? { ...state, progress } : state
          )
        );
      },
      // onComplete
      (id, url) => {
        setUploadStates(prev =>
          prev.map(state =>
            state.id === id 
              ? { ...state, status: 'completed' as const, url, progress: 100 }
              : state
          )
        );
      },
      // onError
      (id, error) => {
        setUploadStates(prev =>
          prev.map(state =>
            state.id === id 
              ? { ...state, status: 'error' as const, error }
              : state
          )
        );
      }
    );
  }, [uploadStates, uploadSingleImage]);

  const getCompletedUrls = useCallback(() => {
    return uploadStates
      .filter(state => state.status === 'completed' && state.url)
      .map(state => state.url!);
  }, [uploadStates]);

  const getAllUrls = useCallback(() => {
    return uploadStates.map(state => state.url || state.id);
  }, [uploadStates]);

  const reset = useCallback(() => {
    setUploadStates([]);
  }, []);

  return {
    uploadStates,
    startUploads,
    retryUpload,
    getCompletedUrls,
    getAllUrls,
    reset,
  };
};