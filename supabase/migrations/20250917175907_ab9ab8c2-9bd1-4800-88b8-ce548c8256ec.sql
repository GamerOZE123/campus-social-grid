-- Fix security warning for ensure_user_order function
CREATE OR REPLACE FUNCTION ensure_user_order()
RETURNS trigger AS $$
BEGIN
  -- Ensure user1_id <= user2_id for consistency
  IF NEW.user1_id > NEW.user2_id THEN
    DECLARE temp_id UUID;
    BEGIN
      temp_id := NEW.user1_id;
      NEW.user1_id := NEW.user2_id;
      NEW.user2_id := temp_id;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update get_or_create_conversation function to handle the new schema
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  conversation_id UUID;
  ordered_user1_id UUID;
  ordered_user2_id UUID;
BEGIN
  -- Ensure consistent ordering
  IF user1_id <= user2_id THEN
    ordered_user1_id := user1_id;
    ordered_user2_id := user2_id;
  ELSE
    ordered_user1_id := user2_id;
    ordered_user2_id := user1_id;
  END IF;

  -- Try to get existing conversation
  SELECT c.id INTO conversation_id
  FROM conversations c
  WHERE c.user1_id = ordered_user1_id AND c.user2_id = ordered_user2_id;

  -- If none exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id)
    VALUES (ordered_user1_id, ordered_user2_id)
    RETURNING id INTO conversation_id;
    
    -- Also add participants to conversation_participants table for compatibility
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES 
      (conversation_id, user1_id),
      (conversation_id, user2_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN conversation_id;
END;
$function$