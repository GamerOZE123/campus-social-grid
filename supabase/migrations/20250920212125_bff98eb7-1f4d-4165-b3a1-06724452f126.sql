-- Fix the get_or_create_conversation function to resolve ambiguous column reference
DROP FUNCTION IF EXISTS get_or_create_conversation(uuid, uuid);

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_id uuid,
  user2_id uuid
) RETURNS uuid AS $$
DECLARE
  conversation_uuid uuid;
BEGIN
  -- Check if conversation already exists
  SELECT c.id INTO conversation_uuid
  FROM conversations c
  WHERE (c.user1_id = $1 AND c.user2_id = $2) 
     OR (c.user1_id = $2 AND c.user2_id = $1);
  
  -- If conversation doesn't exist, create it
  IF conversation_uuid IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id, created_at, updated_at)
    VALUES ($1, $2, now(), now())
    RETURNING id INTO conversation_uuid;
    
    -- Add participants to conversation_participants table
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES 
      (conversation_uuid, $1),
      (conversation_uuid, $2);
  END IF;
  
  RETURN conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;