import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Target, Crown, AlertCircle } from 'lucide-react';
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
  
  // Targeting options
  const [targetUniversities, setTargetUniversities] = useState<string[]>([]);
  const [targetMajors, setTargetMajors] = useState<string[]>([]);
  const [targetYears, setTargetYears] = useState<string[]>([]);
  const [targetLocations, setTargetLocations] = useState<string[]>([]);
  const [priorityPlacement, setPriorityPlacement] = useState(false);

  // Company profile data
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && open) {
      fetchCompanyProfile();
    }
  }, [user, open]);

  const fetchCompanyProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setCompanyProfile(data);
    } catch (error) {
      console.error('Error fetching company profile:', error);
    } finally {
      setLoading(false);
    }
  };

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

    if (!companyProfile) {
      toast({
        title: "Profile Required",
        description: "Please complete your company profile first.",
        variant: "destructive"
      });
      return;
    }

    // Check monthly post limit
    if (companyProfile.monthly_posts_used >= companyProfile.monthly_posts_limit) {
      toast({
        title: "Monthly Limit Reached",
        description: `You've reached your monthly limit of ${companyProfile.monthly_posts_limit} posts. Upgrade your plan for more posts.`,
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

      // Create advertising post with all image URLs and targeting
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
          redirect_url: redirectUrl.trim(),
          target_universities: targetUniversities.length > 0 ? targetUniversities : null,
          target_majors: targetMajors.length > 0 ? targetMajors : null,
          target_years: targetYears.length > 0 ? targetYears : null,
          target_locations: targetLocations.length > 0 ? targetLocations : null,
          priority_placement: priorityPlacement && companyProfile.subscription_tier === 'premium'
        });

      if (insertError) throw insertError;

      // Update monthly posts used count
      await supabase
        .from('company_profiles')
        .update({ 
          monthly_posts_used: companyProfile.monthly_posts_used + 1 
        })
        .eq('user_id', user.id);

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
      setTargetUniversities([]);
      setTargetMajors([]);
      setTargetYears([]);
      setTargetLocations([]);
      setPriorityPlacement(false);
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

  const addTargetTag = (type: 'universities' | 'majors' | 'years' | 'locations', value: string) => {
    if (!value.trim()) return;
    
    switch (type) {
      case 'universities':
        if (!targetUniversities.includes(value)) {
          setTargetUniversities([...targetUniversities, value]);
        }
        break;
      case 'majors':
        if (!targetMajors.includes(value)) {
          setTargetMajors([...targetMajors, value]);
        }
        break;
      case 'years':
        if (!targetYears.includes(value)) {
          setTargetYears([...targetYears, value]);
        }
        break;
      case 'locations':
        if (!targetLocations.includes(value)) {
          setTargetLocations([...targetLocations, value]);
        }
        break;
    }
  };

  const removeTargetTag = (type: 'universities' | 'majors' | 'years' | 'locations', value: string) => {
    switch (type) {
      case 'universities':
        setTargetUniversities(targetUniversities.filter(u => u !== value));
        break;
      case 'majors':
        setTargetMajors(targetMajors.filter(m => m !== value));
        break;
      case 'years':
        setTargetYears(targetYears.filter(y => y !== value));
        break;
      case 'locations':
        setTargetLocations(targetLocations.filter(l => l !== value));
        break;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center p-6">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const canUseTargeting = companyProfile?.targeting_enabled;
  const canUsePriorityPlacement = companyProfile?.subscription_tier === 'premium';
  const remainingPosts = companyProfile?.monthly_posts_limit - companyProfile?.monthly_posts_used;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Create Advertising Post</DialogTitle>
            <Badge variant="outline" className="text-xs">
              {companyProfile?.subscription_tier || 'starter'}
            </Badge>
          </div>
          {companyProfile && (
            <div className="text-sm text-muted-foreground">
              {remainingPosts} of {companyProfile.monthly_posts_limit} posts remaining this month
            </div>
          )}
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

          {/* Targeting Options */}
          {canUseTargeting && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <Label className="text-sm font-medium">Targeting Options</Label>
                <Badge variant="secondary" className="text-xs">
                  {companyProfile?.subscription_tier === 'growth' ? 'Basic' : 'Advanced'}
                </Badge>
              </div>

              {/* Universities */}
              <div className="space-y-2">
                <Label className="text-sm">Target Universities</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {targetUniversities.map((uni) => (
                    <Badge key={uni} variant="secondary" className="text-xs">
                      {uni}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => removeTargetTag('universities', uni)}
                      />
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={(value) => addTargetTag('universities', value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Add university" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IIT Delhi">IIT Delhi</SelectItem>
                    <SelectItem value="IIT Bombay">IIT Bombay</SelectItem>
                    <SelectItem value="IIT Madras">IIT Madras</SelectItem>
                    <SelectItem value="IIT Kanpur">IIT Kanpur</SelectItem>
                    <SelectItem value="IIT Kharagpur">IIT Kharagpur</SelectItem>
                    <SelectItem value="BITS Pilani">BITS Pilani</SelectItem>
                    <SelectItem value="NIT Trichy">NIT Trichy</SelectItem>
                    <SelectItem value="Delhi University">Delhi University</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Majors */}
              <div className="space-y-2">
                <Label className="text-sm">Target Majors</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {targetMajors.map((major) => (
                    <Badge key={major} variant="secondary" className="text-xs">
                      {major}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => removeTargetTag('majors', major)}
                      />
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={(value) => addTargetTag('majors', value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Add major" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Economics">Economics</SelectItem>
                    <SelectItem value="Medicine">Medicine</SelectItem>
                    <SelectItem value="Law">Law</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Years (Advanced targeting only) */}
              {companyProfile?.subscription_tier === 'premium' && (
                <div className="space-y-2">
                  <Label className="text-sm">Target Academic Years</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {targetYears.map((year) => (
                      <Badge key={year} variant="secondary" className="text-xs">
                        {year}
                        <X 
                          className="w-3 h-3 ml-1 cursor-pointer" 
                          onClick={() => removeTargetTag('years', year)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <Select onValueChange={(value) => addTargetTag('years', value)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Add year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="4th Year">4th Year</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Priority Placement */}
          {canUsePriorityPlacement && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <Label className="text-sm font-medium">Premium Features</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="priority"
                  checked={priorityPlacement}
                  onChange={(e) => setPriorityPlacement(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="priority" className="text-sm">
                  Priority placement in feed
                </Label>
              </div>
            </div>
          )}

          {/* Upgrade Prompt */}
          {!canUseTargeting && (
            <div className="bg-muted/50 p-3 rounded-lg border">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Want to target specific audiences?</p>
                  <p className="text-muted-foreground">
                    Upgrade to Growth plan for basic targeting or Premium for advanced targeting options.
                  </p>
                </div>
              </div>
            </div>
          )}

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