-- Fix the get_user_conversations function to resolve ambiguous column reference
CREATE OR REPLACE FUNCTION public.get_user_conversations(target_user_id uuid)
 RETURNS TABLE(conversation_id uuid, other_user_id uuid, other_user_name text, other_user_avatar text, other_user_university text, last_message text, last_message_time timestamp with time zone, unread_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as conversation_id,
        p.user_id as other_user_id,
        p.full_name as other_user_name,
        p.avatar_url as other_user_avatar,
        p.university as other_user_university,
        m.content as last_message,
        m.created_at as last_message_time,
        0::BIGINT as unread_count
    FROM public.conversations c
    JOIN public.conversation_participants cp ON c.id = cp.conversation_id
    JOIN public.conversation_participants cp_other ON c.id = cp_other.conversation_id AND cp_other.user_id != target_user_id
    JOIN public.profiles p ON cp_other.user_id = p.user_id
    LEFT JOIN LATERAL (
        SELECT content, created_at
        FROM public.messages msg
        WHERE msg.conversation_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
    ) m ON true
    WHERE cp.user_id = target_user_id
    ORDER BY m.created_at DESC NULLS LAST;
END;
$function$;