-- Fix infinite recursion in profiles RLS policy
-- The current policy queries profiles table within the policy itself, causing infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Profiles access policy" ON public.profiles;

-- Create simplified policies that don't cause recursion
-- Allow users to see their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow everyone to see basic profile info (but not sensitive data like email)
CREATE POLICY "Public profile info viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Note: This will make all profile fields viewable by everyone
-- If we need to restrict email/sensitive fields, we should use column-level security
-- or create separate views for public vs private profile data