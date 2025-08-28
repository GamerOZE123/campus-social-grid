-- First drop the view that depends on hashtags column
DROP VIEW IF EXISTS trending_hashtags;

-- Now fix hashtags and comments columns in posts table
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

-- Recreate the trending_hashtags view
CREATE VIEW trending_hashtags AS
SELECT 
    unnest(hashtags) as hashtag,
    COUNT(*) as post_count,
    COUNT(DISTINCT user_id) as unique_users,
    MAX(created_at) as last_used
FROM posts 
WHERE hashtags IS NOT NULL AND array_length(hashtags, 1) > 0
GROUP BY unnest(hashtags)
ORDER BY post_count DESC, last_used DESC;