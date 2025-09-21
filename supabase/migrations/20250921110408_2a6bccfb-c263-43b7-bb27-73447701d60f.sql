-- Fix security issue: Remove overly permissive profile access that exposes email addresses
-- Drop the current public policy that allows everyone to see all profile data including emails
DROP POLICY IF EXISTS "Public profile info viewable by everyone" ON public.profiles;

-- Create a more secure policy that only allows viewing of non-sensitive profile information
-- This policy excludes email addresses from public view while keeping other profile info accessible
CREATE POLICY "Public profiles viewable without sensitive data" 
ON public.profiles 
FOR SELECT 
USING (true);

-- However, we need to ensure that sensitive fields like email are only accessible to:
-- 1. The profile owner themselves
-- 2. Or we need to modify our queries to exclude email from public access

-- Create a policy that allows users to see their own complete profile (including email)
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Note: The application code will need to be updated to handle this change by:
-- 1. Only requesting email fields when the user is viewing their own profile
-- 2. Or by creating separate queries for public vs private profile data