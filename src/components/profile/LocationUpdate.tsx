import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Loader2 } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';

interface LocationUpdateProps {
  currentCountry?: string;
  currentState?: string;
  currentArea?: string;
  onLocationUpdated?: () => void;
}

export default function LocationUpdate({ 
  currentCountry = '', 
  currentState = '', 
  currentArea = '', 
  onLocationUpdated 
}: LocationUpdateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [country, setCountry] = useState(currentCountry);
  const [state, setState] = useState(currentState);
  const [area, setArea] = useState(currentArea);
  
  const { fetchAndUpdateLocation, updateLocationManually, loading } = useLocation();

  const handleAutoLocation = async () => {
    const success = await fetchAndUpdateLocation();
    if (success) {
      setIsOpen(false);
      onLocationUpdated?.();
    }
  };

  const handleManualUpdate = async () => {
    if (!country?.trim() || !state?.trim() || !area?.trim()) {
      return;
    }
    
    const success = await updateLocationManually(country.trim(), state.trim(), area.trim());
    if (success) {
      setIsOpen(false);
      onLocationUpdated?.();
    }
  };

  const resetForm = () => {
    setCountry(currentCountry);
    setState(currentState);
    setArea(currentArea);
    setManualMode(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MapPin className="w-4 h-4" />
          Update Location
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Your Location</DialogTitle>
          <DialogDescription>
            This helps others find you and provides relevant local content.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!manualMode ? (
            <div className="space-y-4">
              <Button 
                onClick={handleAutoLocation} 
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                Get Current Location
              </Button>
              
              <div className="text-center">
                <span className="text-sm text-muted-foreground">or</span>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setManualMode(true)}
                className="w-full"
              >
                Enter Location Manually
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="e.g., United States"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  placeholder="e.g., California"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="area">City/Area</Label>
                <Input
                  id="area"
                  placeholder="e.g., San Francisco"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleManualUpdate} 
                  disabled={loading || !country?.trim() || !state?.trim() || !area?.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Update'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setManualMode(false)}
                  className="flex-1"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
          
          {(currentCountry || currentState || currentArea) && (
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
              <strong>Current location:</strong> {currentArea && `${currentArea}, `}{currentState && `${currentState}, `}{currentCountry}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}