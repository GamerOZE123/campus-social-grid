-- Add views_count column to posts table
ALTER TABLE public.posts ADD COLUMN views_count integer NOT NULL DEFAULT 0;

-- Create post_views table for tracking individual views
CREATE TABLE public.post_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  user_id uuid NULL,
  session_id text NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, session_id)
);

-- Enable RLS on post_views
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_views
CREATE POLICY "Post views are viewable by everyone" 
ON public.post_views 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can record post views" 
ON public.post_views 
FOR INSERT 
WITH CHECK (true);

-- Function to update post views count
CREATE OR REPLACE FUNCTION public.update_post_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts SET views_count = views_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update views count
CREATE TRIGGER update_post_views_count_trigger
  AFTER INSERT ON public.post_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_views_count();

-- Index for better performance
CREATE INDEX idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX idx_post_views_session ON public.post_views(session_id, post_id);