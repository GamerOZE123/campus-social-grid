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

-- Update RLS policies to allow companies to access student contact info when appropriate
DROP POLICY IF EXISTS "Public profile data is viewable by others" ON public.profiles;

-- Create new policy that allows access to full profile (including email) for:
-- 1. The user themselves
-- 2. Companies who have received applications from students
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Companies can view student profiles with contact info when they have applications" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != user_id 
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.user_type = 'company'
  )
  AND company_can_access_student_contact(auth.uid(), user_id)
);

-- Create policy for general public profile data (without sensitive info like email)
-- This will be handled by application logic - companies can see basic info but not email
-- unless they have legitimate access
CREATE POLICY "Public profile data is viewable by others" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != user_id 
  AND NOT (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.user_type = 'company'
    )
    AND company_can_access_student_contact(auth.uid(), user_id)
  )
);