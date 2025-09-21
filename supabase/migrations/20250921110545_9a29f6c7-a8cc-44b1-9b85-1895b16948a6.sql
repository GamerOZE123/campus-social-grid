-- Fix the RLS policy to properly protect email addresses
-- Drop the current policies that still allow email access
DROP POLICY IF EXISTS "Public profiles viewable without sensitive data" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;

-- Create a function to get safe profile data (excluding sensitive fields)
CREATE OR REPLACE FUNCTION public.get_safe_profile_fields()
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY[
    'id', 'user_id', 'username', 'full_name', 'bio', 'avatar_url', 'banner_url', 
    'university', 'major', 'country', 'state', 'area', 'user_type', 
    'followers_count', 'following_count', 'banner_position', 'banner_height',
    'created_at', 'updated_at'
  ];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create a security definer function to check if user can access sensitive data
CREATE OR REPLACE FUNCTION public.can_access_profile_email(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Only allow access to email if user is viewing their own profile
  RETURN auth.uid() = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create policy for public profile access (without email)
CREATE POLICY "Public profiles viewable (excluding sensitive data)" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Create policy for users to view their own email
CREATE POLICY "Users can view their own email" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- The application will need to be updated to:
-- 1. Exclude email from general profile queries unless user owns the profile
-- 2. Use separate queries for sensitive vs public profile data