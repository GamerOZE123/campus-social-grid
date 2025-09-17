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