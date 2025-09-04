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
      const fileName = `banner_${user.id}_${Date.now()}.${fileExt}`;
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
      toast.error('Failed to upload banner');
    } finally {
      setLoading(false);
    }
  };

  // Banner height change
  const handleBannerHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = Number(e.target.value);
    setLocalBannerHeight(newHeight);
    onBannerChange(localBannerUrl || '', newHeight);
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
            <Label>Banner</Label>
            {localBannerUrl && (
              <img
                src={localBannerUrl}
                alt="Banner preview"
                className="w-full rounded-lg mb-2 object-cover"
                style={{ height: localBannerHeight }}
              />
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              disabled={loading}
            />
            <div className="flex items-center gap-2 mt-2">
              <Label htmlFor="bannerHeight">Banner Height</Label>
              <input
                id="bannerHeight"
                type="range"
                min={120}
                max={320}
                value={localBannerHeight}
                onChange={handleBannerHeightChange}
                className="w-32"
                disabled={loading}
              />
              <span className="text-xs text-muted-foreground">{localBannerHeight}px</span>
            </div>
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
