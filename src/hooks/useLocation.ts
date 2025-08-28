import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LocationData {
  country: string;
  state: string;
  area: string;
  latitude: number;
  longitude: number;
}

export const useLocation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const reverseGeocode = async (latitude: number, longitude: number): Promise<LocationData> => {
    try {
      // Using a free reverse geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get location details');
      }
      
      const data = await response.json();
      
      return {
        country: data.countryName || 'Unknown',
        state: data.principalSubdivision || 'Unknown',
        area: data.city || data.locality || 'Unknown',
        latitude,
        longitude
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Fallback location data
      return {
        country: 'Unknown',
        state: 'Unknown', 
        area: 'Unknown',
        latitude,
        longitude
      };
    }
  };

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  const fetchAndUpdateLocation = async () => {
    if (!user) {
      toast.error('Please log in to update location');
      return false;
    }

    setLoading(true);
    try {
      toast.info('Getting your location...');
      
      // Get user's current position
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;
      
      toast.info('Getting location details...');
      
      // Get location details from coordinates
      const locationDetails = await reverseGeocode(latitude, longitude);
      setLocationData(locationDetails);
      
      // Update user's profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          country: locationDetails.country,
          state: locationDetails.state,
          area: locationDetails.area
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating location:', error);
        throw error;
      }

      toast.success(`Location updated: ${locationDetails.area}, ${locationDetails.state}, ${locationDetails.country}`);
      return true;
    } catch (error: any) {
      console.error('Location error:', error);
      
      if (error.code === error.PERMISSION_DENIED) {
        toast.error('Location access denied. Please enable location permissions and try again.');
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        toast.error('Location information is unavailable.');
      } else if (error.code === error.TIMEOUT) {
        toast.error('Location request timed out. Please try again.');
      } else {
        toast.error('Failed to get location. Please try again.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateLocationManually = async (country: string, state: string, area: string) => {
    if (!user) {
      toast.error('Please log in to update location');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          country,
          state,
          area
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating location:', error);
        throw error;
      }

      setLocationData({
        country,
        state,
        area,
        latitude: 0,
        longitude: 0
      });

      toast.success(`Location updated: ${area}, ${state}, ${country}`);
      return true;
    } catch (error) {
      console.error('Manual location update error:', error);
      toast.error('Failed to update location');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchAndUpdateLocation,
    updateLocationManually,
    loading,
    locationData
  };
};