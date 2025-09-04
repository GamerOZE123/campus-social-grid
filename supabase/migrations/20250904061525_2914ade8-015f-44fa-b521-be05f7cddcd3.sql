-- Add banner columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN banner_url text,
ADD COLUMN banner_height integer DEFAULT 200;

-- Create profile-banner storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-banner', 'profile-banner', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile banners
CREATE POLICY "Profile banners are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-banner');

CREATE POLICY "Users can upload their own profile banner" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-banner' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile banner" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-banner' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile banner" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-banner' AND auth.uid()::text = (storage.foldername(name))[1]);