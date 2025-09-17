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