-- Add multiple image URL columns to advertising_posts table for progressive loading
ALTER TABLE public.advertising_posts 
ADD COLUMN image_thumbnail_url TEXT,
ADD COLUMN image_medium_url TEXT,
ADD COLUMN image_original_url TEXT;

-- Create an index for better performance when querying by company_id
CREATE INDEX IF NOT EXISTS idx_advertising_posts_company_id ON public.advertising_posts(company_id);

-- Also add the same columns to posts table for consistency
ALTER TABLE public.posts
ADD COLUMN image_thumbnail_url TEXT,
ADD COLUMN image_medium_url TEXT,  
ADD COLUMN image_original_url TEXT;