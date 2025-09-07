-- Create ranked_posts view with scoring algorithm
CREATE OR REPLACE VIEW public.ranked_posts AS
SELECT 
    p.*,
    (
        -- +2 points for each like
        (p.likes_count * 2) +
        -- +3 points for each comment  
        (p.comments_count * 3) +
        -- +4 points for each share (assuming shares_count exists, using 0 for now)
        (COALESCE(0, 0) * 4) -
        -- -0.1 points for every hour since creation
        (EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 * 0.1)
    )::NUMERIC(10,2) AS score
FROM public.posts p
WHERE p.created_at IS NOT NULL
ORDER BY score DESC;