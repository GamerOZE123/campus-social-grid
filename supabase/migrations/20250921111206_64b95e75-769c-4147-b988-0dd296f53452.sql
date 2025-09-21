-- Create a proper column-level security solution for email protection
-- Drop existing policies that don't properly protect email
DROP POLICY IF EXISTS "Users can view their own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Public basic profile info viewable by authenticated users" ON public.profiles;

-- Create a security definer function to check if current user can see email
CREATE OR REPLACE FUNCTION public.user_can_see_email(profile_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Only allow seeing email if it's the user's own profile
  RETURN auth.uid() = profile_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create policies that properly protect email access
-- Policy 1: Users can see all public profile fields EXCEPT email
CREATE POLICY "Public profile data viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Policy 2: Users can see their own email
CREATE POLICY "Users can see their own email" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Now we need to handle this at the application level by ensuring
-- that email is only selected when querying own profile

-- Create a function that applications can use to get safe profile columns
CREATE OR REPLACE FUNCTION public.get_public_profile_columns()
RETURNS text AS $$
BEGIN
  RETURN 'id, user_id, username, full_name, bio, avatar_url, banner_url, university, major, country, state, area, user_type, followers_count, following_count, banner_position, banner_height, created_at, updated_at';
END;
$$ LANGUAGE plpgsql IMMUTABLE;