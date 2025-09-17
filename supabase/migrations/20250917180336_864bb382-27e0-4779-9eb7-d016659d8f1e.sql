-- Add missing columns to recent_chats table that the functions expect
ALTER TABLE public.recent_chats 
ADD COLUMN IF NOT EXISTS other_user_name TEXT,
ADD COLUMN IF NOT EXISTS other_user_university TEXT,
ADD COLUMN IF NOT EXISTS other_user_avatar TEXT;

-- Update the get_recent_chats function to use the table columns directly
CREATE OR REPLACE FUNCTION public.get_recent_chats(target_user_id uuid)
RETURNS TABLE(other_user_id uuid, other_user_name text, other_user_avatar text, other_user_university text, last_interacted_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rc.other_user_id,
    rc.other_user_name,
    rc.other_user_avatar,
    rc.other_user_university,
    rc.last_interacted_at
  FROM recent_chats rc
  WHERE rc.user_id = target_user_id
  AND rc.deleted_at IS NULL  -- Exclude deleted chats
  ORDER BY rc.last_interacted_at DESC;
END;
$function$

-- Update the upsert_recent_chat function to work with the new columns
CREATE OR REPLACE FUNCTION public.upsert_recent_chat(current_user_id uuid, target_user_id uuid, other_user_name text, other_user_university text, other_user_avatar text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  INSERT INTO recent_chats (
    user_id,
    other_user_id,
    other_user_name,
    other_user_university,
    other_user_avatar,
    last_interacted_at
  )
  VALUES (
    current_user_id,
    target_user_id,
    other_user_name,
    other_user_university,
    other_user_avatar,
    NOW()
  )
  ON CONFLICT (user_id, other_user_id)
  DO UPDATE SET
    other_user_name = EXCLUDED.other_user_name,
    other_user_university = EXCLUDED.other_user_university,
    other_user_avatar = EXCLUDED.other_user_avatar,
    last_interacted_at = NOW(),
    deleted_at = NULL;  -- Reset deletion for new activity
END;
$function$