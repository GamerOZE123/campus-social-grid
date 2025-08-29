-- Create advertising posts table
CREATE TABLE public.advertising_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  redirect_url TEXT NOT NULL,
  click_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create advertising post clicks tracking table
CREATE TABLE public.advertising_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertising_post_id UUID NOT NULL,
  user_id UUID,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create advertising post likes table
CREATE TABLE public.advertising_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertising_post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(advertising_post_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.advertising_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertising_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertising_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advertising_posts
CREATE POLICY "Advertising posts are viewable by everyone" 
ON public.advertising_posts 
FOR SELECT 
USING (true);

CREATE POLICY "Companies can create their own advertising posts" 
ON public.advertising_posts 
FOR INSERT 
WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Companies can update their own advertising posts" 
ON public.advertising_posts 
FOR UPDATE 
USING (auth.uid() = company_id);

CREATE POLICY "Companies can delete their own advertising posts" 
ON public.advertising_posts 
FOR DELETE 
USING (auth.uid() = company_id);

-- RLS Policies for advertising_clicks
CREATE POLICY "Advertising clicks are viewable by post owners" 
ON public.advertising_clicks 
FOR SELECT 
USING (
  advertising_post_id IN (
    SELECT id FROM public.advertising_posts WHERE company_id = auth.uid()
  )
);

CREATE POLICY "Anyone can create advertising clicks" 
ON public.advertising_clicks 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for advertising_likes
CREATE POLICY "Advertising likes are viewable by everyone" 
ON public.advertising_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own advertising likes" 
ON public.advertising_likes 
FOR ALL 
USING (auth.uid() = user_id);

-- Create triggers for updating counts
CREATE OR REPLACE FUNCTION public.update_advertising_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.advertising_posts SET likes_count = likes_count + 1 WHERE id = NEW.advertising_post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.advertising_posts SET likes_count = likes_count - 1 WHERE id = OLD.advertising_post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_advertising_post_click_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.advertising_posts SET click_count = click_count + 1 WHERE id = NEW.advertising_post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER update_advertising_posts_likes_count
  AFTER INSERT OR DELETE ON public.advertising_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_advertising_post_likes_count();

CREATE TRIGGER update_advertising_posts_click_count
  AFTER INSERT ON public.advertising_clicks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_advertising_post_click_count();

-- Add updated_at trigger for advertising_posts
CREATE TRIGGER update_advertising_posts_updated_at
  BEFORE UPDATE ON public.advertising_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();