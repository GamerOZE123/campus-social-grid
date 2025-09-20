-- Add foreign key constraint between comments and profiles
ALTER TABLE public.comments 
ADD CONSTRAINT fk_comments_user_profile 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;