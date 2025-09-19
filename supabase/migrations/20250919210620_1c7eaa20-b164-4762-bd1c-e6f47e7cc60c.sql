-- Add views_count column to advertising_posts table
ALTER TABLE public.advertising_posts ADD COLUMN views_count integer NOT NULL DEFAULT 0;

-- Create advertising_post_views table for tracking views
CREATE TABLE public.advertising_post_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertising_post_id uuid NOT NULL,
  user_id uuid NULL,
  session_id text NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.advertising_post_views ENABLE ROW LEVEL SECURITY;

-- Create policies for advertising_post_views
CREATE POLICY "Anyone can record advertising post views" 
ON public.advertising_post_views 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Advertising post views are viewable by everyone" 
ON public.advertising_post_views 
FOR SELECT 
USING (true);

-- Create unique constraint to prevent duplicate views per user/session per post
CREATE UNIQUE INDEX advertising_post_views_unique_user_post 
ON public.advertising_post_views (advertising_post_id, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX advertising_post_views_unique_session_post 
ON public.advertising_post_views (advertising_post_id, session_id) 
WHERE user_id IS NULL;

-- Create function to update advertising post views count
CREATE OR REPLACE FUNCTION public.update_advertising_post_views_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.advertising_posts SET views_count = views_count + 1 WHERE id = NEW.advertising_post_id;
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically update views_count
CREATE TRIGGER update_advertising_post_views_count_trigger
  AFTER INSERT ON public.advertising_post_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_advertising_post_views_count();