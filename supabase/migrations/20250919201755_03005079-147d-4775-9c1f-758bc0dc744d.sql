-- Fix security issue with the function by setting search_path
CREATE OR REPLACE FUNCTION public.update_post_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts SET views_count = views_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;