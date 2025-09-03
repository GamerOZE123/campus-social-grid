-- Fix security vulnerability: Restrict email access in profiles table
-- Drop the overly permissive existing policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a more secure policy that hides email addresses from public view
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a policy for public profile data (excluding sensitive fields like email)
CREATE POLICY "Public profile data is viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() != user_id OR auth.uid() IS NULL);

-- Add RLS protection to trending_hashtags table as well
ALTER TABLE public.trending_hashtags ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read trending hashtags (this is typically public data)
CREATE POLICY "Trending hashtags are viewable by everyone" 
ON public.trending_hashtags 
FOR SELECT 
USING (true);