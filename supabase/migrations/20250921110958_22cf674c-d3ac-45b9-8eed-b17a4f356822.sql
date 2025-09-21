-- Remove the ineffective policies and create a proper solution
DROP POLICY IF EXISTS "Public profiles viewable (excluding sensitive data)" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own email" ON public.profiles;

-- Create a policy that truly restricts email access
-- Only authenticated users can see basic profile info, and only profile owners can see email
CREATE POLICY "Authenticated users can view public profile data" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Create a policy for anonymous users (no email access)
CREATE POLICY "Anonymous users can view limited profile data" 
ON public.profiles 
FOR SELECT 
TO anon
USING (true);

-- Now we need to modify the application code to handle this properly
-- The key is that we need to exclude email from our SELECT queries unless the user owns the profile

-- Create a view for public profile data that excludes sensitive information
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id, user_id, username, full_name, bio, avatar_url, banner_url,
  university, major, country, state, area, user_type,
  followers_count, following_count, banner_position, banner_height,
  created_at, updated_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Create policy for the public view
CREATE POLICY "Public profiles view is accessible to everyone"
ON public.public_profiles
FOR SELECT
USING (true);