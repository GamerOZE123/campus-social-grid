import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Globe } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';

interface AutoLocationButtonProps {
  onLocationUpdated?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'lg' | 'icon';
  showText?: boolean;
  useIP?: boolean;
}

export default function AutoLocationButton({ 
  onLocationUpdated, 
  variant = 'outline',
  size = 'sm',
  showText = true,
  useIP = false
}: AutoLocationButtonProps) {
  const { fetchAndUpdateLocation, getLocationFromIP, loading } = useLocation();

  const handleLocationUpdate = async () => {
    const success = useIP ? await getLocationFromIP() : await fetchAndUpdateLocation();
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
      ) : useIP ? (
        <Globe className="w-4 h-4" />
      ) : (
        <MapPin className="w-4 h-4" />
      )}
      {showText && (loading ? 'Getting Location...' : useIP ? 'Auto-Detect Location' : 'GPS Location')}
    </Button>
  );
}