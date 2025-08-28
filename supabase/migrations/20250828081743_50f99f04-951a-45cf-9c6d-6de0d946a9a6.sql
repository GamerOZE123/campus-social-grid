-- Fix hashtags and comments columns in posts table
-- Ensure hashtags column is properly configured as text array
ALTER TABLE posts ALTER COLUMN hashtags SET DEFAULT '{}';
ALTER TABLE posts ALTER COLUMN hashtags TYPE text[] USING 
  CASE 
    WHEN hashtags IS NULL THEN '{}'::text[]
    ELSE hashtags::text[]
  END;

-- Ensure comments_count is properly initialized
UPDATE posts SET comments_count = 0 WHERE comments_count IS NULL;
UPDATE posts SET likes_count = 0 WHERE likes_count IS NULL;

-- Create index for better hashtag search performance
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN (hashtags);

-- Create function to extract hashtags from content
CREATE OR REPLACE FUNCTION extract_hashtags_from_content(content_text text)
RETURNS text[] AS $$
DECLARE
    hashtag_matches text[];
BEGIN
    -- Extract hashtags using regex pattern
    SELECT array_agg(DISTINCT lower(regexp_replace(match, '^#', '')))
    INTO hashtag_matches
    FROM regexp_split_to_table(content_text, '\s+') AS match
    WHERE match ~ '^#[a-zA-Z0-9_]+$' AND length(match) > 1;
    
    RETURN COALESCE(hashtag_matches, '{}');
END;
$$ LANGUAGE plpgsql;