-- Add image_urls column to posts table for multiple image support
ALTER TABLE public.posts ADD COLUMN image_urls TEXT[] DEFAULT NULL;

-- Add comment to explain the new column
COMMENT ON COLUMN public.posts.image_urls IS 'Array of image URLs for multiple image posts';

-- Create index for better query performance on image_urls
CREATE INDEX idx_posts_image_urls ON public.posts USING GIN(image_urls);