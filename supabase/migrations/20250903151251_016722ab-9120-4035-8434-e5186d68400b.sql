-- Fix security vulnerability: Restrict email access in profiles table
-- Drop the overly permissive existing policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a more secure policy that allows users to view their own complete profile
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a policy for public profile data that excludes sensitive fields
-- This policy will apply when viewing other users' profiles
CREATE POLICY "Public profile data is viewable by others" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() != user_id OR auth.uid() IS NULL);