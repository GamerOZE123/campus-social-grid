import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  
  // Targeting options
  const [targetUniversities, setTargetUniversities] = useState<string[]>([]);
  const [targetMajors, setTargetMajors] = useState<string[]>([]);
  const [targetYears, setTargetYears] = useState<string[]>([]);
  const [targetLocations, setTargetLocations] = useState<string[]>([]);
  const [priorityPlacement, setPriorityPlacement] = useState(false);

  // University options
  const universityOptions = [
    'Indian Institute of Technology Delhi',
    'Indian Institute of Technology Bombay', 
    'Indian Institute of Technology Madras',
    'Indian Institute of Technology Kanpur',
    'Indian Institute of Technology Kharagpur',
    'Indian Institute of Science Bangalore',
    'Delhi University',
    'Jawaharlal Nehru University',
    'University of Mumbai',
    'Anna University'
  ];

  // Major options
  const majorOptions = [
    'Computer Science',
    'Electrical Engineering',
    'Mechanical Engineering', 
    'Civil Engineering',
    'Chemical Engineering',
    'Electronics and Communication',
    'Biotechnology',
    'Management Studies',
    'Economics',
    'Physics',
    'Mathematics',
    'Chemistry'
  ];

  // Year options
  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PhD'];

  // Location options
  const locationOptions = [
    'Delhi NCR',
    'Mumbai',
    'Bangalore',
    'Chennai', 
    'Kolkata',
    'Hyderabad',
    'Pune',
    'Ahmedabad',
    'Kochi',
    'Chandigarh'
  ];

  // Fetch company profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        const { data, error } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setCompanyProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    if (open) {
      fetchProfile();
    }
  }, [open]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !redirectUrl || !imageFile) return;

    // Check post limits
    if (companyProfile && companyProfile.monthly_posts_used >= companyProfile.monthly_posts_limit) {
      toast({
        title: "Post Limit Reached",
        description: "You've reached your monthly post limit. Upgrade your plan to create more posts.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Process image using edge function
      const formData = new FormData();
      formData.append('image', imageFile);

      const { data: processedData, error: processError } = await supabase.functions.invoke('process-image', {
        body: formData,
      });

      if (processError) throw processError;

      // Create advertising post with targeting options
      const { error: postError } = await supabase
        .from('advertising_posts')
        .insert({
          company_id: user.id,
          title,
          description,
          redirect_url: redirectUrl,
          image_url: processedData.original_url,
          image_thumbnail_url: processedData.thumbnail_url,
          image_medium_url: processedData.medium_url,
          image_original_url: processedData.original_url,
          target_universities: targetUniversities.length > 0 ? targetUniversities : null,
          target_majors: targetMajors.length > 0 ? targetMajors : null,
          target_years: targetYears.length > 0 ? targetYears : null,
          target_locations: targetLocations.length > 0 ? targetLocations : null,
          priority_placement: priorityPlacement && companyProfile?.subscription_tier === 'premium'
        });

      if (postError) throw postError;

      // Update monthly posts used
      await supabase
        .from('company_profiles')
        .update({ monthly_posts_used: (companyProfile?.monthly_posts_used || 0) + 1 })
        .eq('user_id', user.id);

      toast({
        title: "Post Created",
        description: "Your advertising post has been created successfully!",
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
      
      onPostCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleArrayValue = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  const canUseTargeting = companyProfile?.subscription_tier !== 'starter';
  const canUsePriorityPlacement = companyProfile?.subscription_tier === 'premium';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Create Advertising Post
          </DialogTitle>
          {companyProfile && (
            <p className="text-sm text-muted-foreground">
              {companyProfile.monthly_posts_used}/{companyProfile.monthly_posts_limit} posts used this month
            </p>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Post Image</Label>
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Post preview" 
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload image</span>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG (MAX. 10MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Post Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="redirectUrl">Website URL</Label>
                <Input
                  id="redirectUrl"
                  type="url"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter post description"
                rows={3}
                required
              />
            </div>
          </div>

          {/* Targeting Options */}
          {canUseTargeting && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <h3 className="font-semibold">Targeting Options</h3>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {companyProfile?.subscription_tier === 'growth' ? 'Growth' : 'Premium'} Feature
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Universities */}
                <div className="space-y-2">
                  <Label>Target Universities</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                    {universityOptions.map((university) => (
                      <div key={university} className="flex items-center space-x-2">
                        <Checkbox
                          checked={targetUniversities.includes(university)}
                          onCheckedChange={() => toggleArrayValue(targetUniversities, university, setTargetUniversities)}
                        />
                        <label className="text-sm">{university}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Majors */}
                <div className="space-y-2">
                  <Label>Target Majors</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                    {majorOptions.map((major) => (
                      <div key={major} className="flex items-center space-x-2">
                        <Checkbox
                          checked={targetMajors.includes(major)}
                          onCheckedChange={() => toggleArrayValue(targetMajors, major, setTargetMajors)}
                        />
                        <label className="text-sm">{major}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Years */}
                <div className="space-y-2">
                  <Label>Target Years</Label>
                  <div className="flex flex-wrap gap-2">
                    {yearOptions.map((year) => (
                      <div key={year} className="flex items-center space-x-2">
                        <Checkbox
                          checked={targetYears.includes(year)}
                          onCheckedChange={() => toggleArrayValue(targetYears, year, setTargetYears)}
                        />
                        <label className="text-sm">{year}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Locations */}
                <div className="space-y-2">
                  <Label>Target Locations</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                    {locationOptions.map((location) => (
                      <div key={location} className="flex items-center space-x-2">
                        <Checkbox
                          checked={targetLocations.includes(location)}
                          onCheckedChange={() => toggleArrayValue(targetLocations, location, setTargetLocations)}
                        />
                        <label className="text-sm">{location}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Priority Placement */}
              {canUsePriorityPlacement && (
                <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={priorityPlacement}
                          onCheckedChange={(checked) => setPriorityPlacement(checked === true)}
                        />
                  <Label>Priority Placement (Premium feature)</Label>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title || !description || !redirectUrl || !imageFile || uploading}
              className="flex-1"
            >
              {uploading ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}