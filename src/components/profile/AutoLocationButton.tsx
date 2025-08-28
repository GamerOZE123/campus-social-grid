import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';

interface AutoLocationButtonProps {
  onLocationUpdated?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export default function AutoLocationButton({ 
  onLocationUpdated, 
  variant = 'outline',
  size = 'sm',
  showText = true 
}: AutoLocationButtonProps) {
  const { fetchAndUpdateLocation, loading } = useLocation();

  const handleLocationUpdate = async () => {
    const success = await fetchAndUpdateLocation();
    if (success) {
      onLocationUpdated?.();
    }
  };

  return (
    <Button 
      onClick={handleLocationUpdate} 
      disabled={loading}
      variant={variant}
      size={size}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MapPin className="w-4 h-4" />
      )}
      {showText && (loading ? 'Getting Location...' : 'Update Location')}
    </Button>
  );
}