import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: () => void;
  onBannerChange: (url: string, height: number) => void;
  bannerUrl: string | null;
  bannerHeight: number;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  onProfileUpdate,
  onBannerChange,
  bannerUrl,
  bannerHeight,
}: EditProfileModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    username: '',
    bio: '',
    university: '',
    major: ''
  });

  // Banner local state
  const [localBannerUrl, setLocalBannerUrl] = useState<string | null>(bannerUrl);
  const [localBannerHeight, setLocalBannerHeight] = useState<number>(bannerHeight);
  const [verticalPosition, setVerticalPosition] = useState<number>(50); // 0-100 percentage

  useEffect(() => {
    if (isOpen && user) {
      fetchProfile();
    }
    setLocalBannerUrl(bannerUrl);
    setLocalBannerHeight(bannerHeight);
    // eslint-disable-next-line
  }, [isOpen, user, bannerUrl, bannerHeight]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          username: data.username || '',
          bio: data.bio || '',
          university: data.university || '',
          major: data.major || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error?.message || error);
    }
  };

  // Banner upload handler
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/banner_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('profile-banner')
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage
        .from('profile-banner')
        .getPublicUrl(fileName);
      const publicUrl = publicUrlData?.publicUrl || '';
      setLocalBannerUrl(publicUrl);
      onBannerChange(publicUrl, localBannerHeight);
      toast.success('Banner uploaded!');
    } catch (error) {
      console.error('Banner upload error:', error);
      toast.error('Failed to upload banner');
    } finally {
      setLoading(false);
    }
  };

  // Banner delete handler
  const handleBannerDelete = async () => {
    if (!localBannerUrl || !user) return;
    setLoading(true);
    try {
      // Extract filename from URL
      const urlParts = localBannerUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;
      
      const { error } = await supabase.storage
        .from('profile-banner')
        .remove([filePath]);
      
      if (error) throw error;
      
      setLocalBannerUrl(null);
      onBannerChange('', localBannerHeight);
      toast.success('Banner deleted!');
    } catch (error) {
      console.error('Banner delete error:', error);
      toast.error('Failed to delete banner');
    } finally {
      setLoading(false);
    }
  };

  // Banner vertical position change
  const handleVerticalPositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = Number(e.target.value);
    setVerticalPosition(newPosition);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          username: profile.username,
          bio: profile.bio,
          university: profile.university,
          major: profile.major,
          banner_url: localBannerUrl,
          banner_height: localBannerHeight,
          banner_position: verticalPosition,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Profile updated successfully');
      onProfileUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error?.message || error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Banner upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Banner</Label>
              {localBannerUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBannerDelete}
                  disabled={loading}
                  className="text-destructive hover:text-destructive"
                >
                  Delete Banner
                </Button>
              )}
            </div>
            {localBannerUrl ? (
              <div className="relative mb-2 overflow-hidden rounded-lg border" style={{ aspectRatio: '3/1' }}>
                <img
                  src={localBannerUrl}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                  style={{ 
                    objectPosition: `center ${verticalPosition}%`
                  }}
                />
                <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs">
                  Preview
                </div>
              </div>
            ) : (
              <div 
                className="w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center text-muted-foreground mb-2"
                style={{ aspectRatio: '3/1' }}
              >
                No banner uploaded
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              disabled={loading}
              className="mb-2"
            />
            {localBannerUrl && (
              <div className="flex items-center gap-2">
                <Label htmlFor="verticalPosition" className="text-sm">Position:</Label>
                <input
                  id="verticalPosition"
                  type="range"
                  min={0}
                  max={100}
                  value={verticalPosition}
                  onChange={handleVerticalPositionChange}
                  className="flex-1"
                  disabled={loading}
                />
                <span className="text-xs text-muted-foreground min-w-[50px]">{verticalPosition}%</span>
              </div>
            )}
          </div>
          {/* Profile fields */}
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              placeholder="Enter your username"
            />
          </div>
          <div>
            <Label htmlFor="university">University</Label>
            <Input
              id="university"
              value={profile.university}
              onChange={(e) => setProfile({ ...profile, university: e.target.value })}
              placeholder="Enter your university"
            />
          </div>
          <div>
            <Label htmlFor="major">Major</Label>
            <Input
              id="major"
              value={profile.major}
              onChange={(e) => setProfile({ ...profile, major: e.target.value })}
              placeholder="Enter your major"
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
