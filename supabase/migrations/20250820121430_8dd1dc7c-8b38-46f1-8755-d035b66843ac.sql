
-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post-images', 'post-images', true);

-- Create RLS policy for post images - allow authenticated users to upload
CREATE POLICY "Authenticated users can upload post images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-images');

-- Allow public read access to post images
CREATE POLICY "Public can view post images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'post-images');

-- Allow users to delete their own post images
CREATE POLICY "Users can delete their own post images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
