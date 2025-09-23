-- Add subscription tier system to company profiles
ALTER TABLE public.company_profiles 
ADD COLUMN subscription_tier text DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'growth', 'premium')),
ADD COLUMN monthly_posts_used integer DEFAULT 0,
ADD COLUMN monthly_posts_limit integer DEFAULT 5,
ADD COLUMN subscription_expires_at timestamp with time zone DEFAULT (now() + interval '30 days'),
ADD COLUMN targeting_enabled boolean DEFAULT false,
ADD COLUMN analytics_tier text DEFAULT 'basic' CHECK (analytics_tier IN ('basic', 'standard', 'advanced'));

-- Update monthly limits based on tier
UPDATE public.company_profiles 
SET monthly_posts_limit = CASE 
  WHEN subscription_tier = 'starter' THEN 5
  WHEN subscription_tier = 'growth' THEN 15
  WHEN subscription_tier = 'premium' THEN 25
  ELSE 5
END;

-- Add homepage banner ads table for Premium tier
CREATE TABLE public.homepage_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  title text NOT NULL,
  image_url text NOT NULL,
  image_thumbnail_url text,
  image_medium_url text,
  image_original_url text,
  redirect_url text NOT NULL,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  click_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on homepage banners
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;

-- RLS policies for homepage banners
CREATE POLICY "Homepage banners are viewable by everyone" 
ON public.homepage_banners 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Premium companies can create homepage banners" 
ON public.homepage_banners 
FOR INSERT 
WITH CHECK (
  auth.uid() = company_id AND 
  EXISTS (
    SELECT 1 FROM public.company_profiles 
    WHERE user_id = auth.uid() AND subscription_tier = 'premium'
  )
);

CREATE POLICY "Companies can update their own banners" 
ON public.homepage_banners 
FOR UPDATE 
USING (auth.uid() = company_id);

CREATE POLICY "Companies can delete their own banners" 
ON public.homepage_banners 
FOR DELETE 
USING (auth.uid() = company_id);

-- Add banner clicks tracking table
CREATE TABLE public.homepage_banner_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id uuid NOT NULL REFERENCES public.homepage_banners(id) ON DELETE CASCADE,
  user_id uuid,
  ip_address text,
  user_agent text,
  clicked_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on banner clicks
ALTER TABLE public.homepage_banner_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create banner clicks" 
ON public.homepage_banner_clicks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Banner clicks are viewable by banner owners" 
ON public.homepage_banner_clicks 
FOR SELECT 
USING (
  banner_id IN (
    SELECT id FROM public.homepage_banners 
    WHERE company_id = auth.uid()
  )
);

-- Add banner views tracking table
CREATE TABLE public.homepage_banner_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id uuid NOT NULL REFERENCES public.homepage_banners(id) ON DELETE CASCADE,
  user_id uuid,
  session_id text NOT NULL,
  viewed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on banner views
ALTER TABLE public.homepage_banner_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record banner views" 
ON public.homepage_banner_views 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Banner views are viewable by banner owners" 
ON public.homepage_banner_views 
FOR SELECT 
USING (
  banner_id IN (
    SELECT id FROM public.homepage_banners 
    WHERE company_id = auth.uid()
  )
);

-- Add targeting options to advertising posts
ALTER TABLE public.advertising_posts
ADD COLUMN target_universities text[],
ADD COLUMN target_majors text[],
ADD COLUMN target_years text[],
ADD COLUMN target_locations text[],
ADD COLUMN priority_placement boolean DEFAULT false;

-- Function to update banner click count
CREATE OR REPLACE FUNCTION public.update_banner_click_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.homepage_banners 
  SET click_count = click_count + 1 
  WHERE id = NEW.banner_id;
  RETURN NEW;
END;
$$;

-- Function to update banner views count  
CREATE OR REPLACE FUNCTION public.update_banner_views_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.homepage_banners 
  SET views_count = views_count + 1 
  WHERE id = NEW.banner_id;
  RETURN NEW;
END;
$$;

-- Triggers for banner analytics
CREATE TRIGGER update_banner_click_count_trigger
AFTER INSERT ON public.homepage_banner_clicks
FOR EACH ROW EXECUTE FUNCTION public.update_banner_click_count();

CREATE TRIGGER update_banner_views_count_trigger
AFTER INSERT ON public.homepage_banner_views
FOR EACH ROW EXECUTE FUNCTION public.update_banner_views_count();

-- Function to reset monthly post usage (can be called by a cron job)
CREATE OR REPLACE FUNCTION public.reset_monthly_post_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.company_profiles 
  SET monthly_posts_used = 0
  WHERE subscription_expires_at <= now();
  
  -- Extend subscription by 30 days
  UPDATE public.company_profiles 
  SET subscription_expires_at = subscription_expires_at + interval '30 days'
  WHERE subscription_expires_at <= now();
END;
$$;