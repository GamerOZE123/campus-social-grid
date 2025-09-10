import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePlaceholderProps {
  status: 'uploading' | 'error' | 'loading';
  progress?: number;
  onRetry?: () => void;
  className?: string;
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  status,
  progress = 0,
  onRetry,
  className = ''
}) => {
  return (
    <div className={`relative aspect-square rounded-xl overflow-hidden border border-border bg-muted ${className}`}>
      <Skeleton className="w-full h-full" />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        {status === 'uploading' && (
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
            <div className="text-sm text-muted-foreground mb-2">Uploading...</div>
            {progress > 0 && (
              <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </>
        )}
        
        {status === 'loading' && (
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
            <div className="text-sm text-muted-foreground">Loading...</div>
          </>
        )}
        
        {status === 'error' && (
          <>
            <AlertCircle className="w-8 h-8 text-destructive mb-2" />
            <div className="text-sm text-muted-foreground mb-3">Upload failed</div>
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};