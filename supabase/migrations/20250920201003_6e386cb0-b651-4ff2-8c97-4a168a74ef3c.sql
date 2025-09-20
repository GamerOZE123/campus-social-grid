-- Harden function and set search_path for stability
CREATE OR REPLACE FUNCTION public.get_user_conversations(target_user_id uuid)
 RETURNS TABLE(
   conversation_id uuid,
   other_user_id uuid,
   other_user_name text,
   other_user_avatar text,
   other_user_university text,
   last_message text,
   last_message_time timestamptz,
   unread_count integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS conversation_id,
    CASE 
      WHEN c.user1_id = target_user_id THEN c.user2_id 
      ELSE c.user1_id 
    END AS other_user_id,
    p.full_name AS other_user_name,
    p.avatar_url AS other_user_avatar,
    p.university AS other_user_university,
    m.content AS last_message,
    m.created_at AS last_message_time,
    0 AS unread_count
  FROM public.conversations c
  JOIN public.profiles p ON (
    (c.user1_id = target_user_id AND p.user_id = c.user2_id) OR 
    (c.user2_id = target_user_id AND p.user_id = c.user1_id)
  )
  LEFT JOIN LATERAL (
    SELECT msg.content, msg.created_at
    FROM public.messages AS msg
    WHERE msg.conversation_id = c.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) m ON true
  WHERE (c.user1_id = target_user_id OR c.user2_id = target_user_id);
END;
$$;