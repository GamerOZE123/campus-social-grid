-- Create security definer functions to allow legitimate access to student contact info

-- Function to check if a company can access a student's contact info
-- This allows access if the student has applied to the company's jobs
CREATE OR REPLACE FUNCTION public.company_can_access_student_contact(company_user_id uuid, student_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if student has applied to any of the company's jobs
  RETURN EXISTS (
    SELECT 1 
    FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE j.company_id = company_user_id 
    AND ja.student_id = student_user_id
  );
END;
$$;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profile data is viewable by others" ON public.profiles;

-- Create new comprehensive policy that handles all cases
CREATE POLICY "Profiles access policy" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always see their own complete profile
  auth.uid() = user_id
  OR
  -- Companies can see full student profiles (including email) when students have applied to their jobs
  (
    auth.uid() != user_id 
    AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.user_type = 'company'
    )
    AND company_can_access_student_contact(auth.uid(), user_id)
  )
  OR
  -- Everyone else can see basic profile info (application will handle email filtering)
  (auth.uid() != user_id OR auth.uid() IS NULL)
);