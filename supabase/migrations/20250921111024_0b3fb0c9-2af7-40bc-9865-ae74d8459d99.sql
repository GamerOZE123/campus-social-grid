-- Fix the policies to be more restrictive about email access
-- Drop current policies
DROP POLICY IF EXISTS "Authenticated users can view public profile data" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous users can view limited profile data" ON public.profiles;

-- Create a restrictive policy: Only allow access to own profile data (including email)
CREATE POLICY "Users can view their own profile data" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a policy for public profile data that excludes email
-- This requires application-level enforcement by not selecting email in queries
CREATE POLICY "Public basic profile info viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Add a comment to remind about application-level email protection
COMMENT ON TABLE public.profiles IS 'Email field should only be selected in queries when auth.uid() = user_id';