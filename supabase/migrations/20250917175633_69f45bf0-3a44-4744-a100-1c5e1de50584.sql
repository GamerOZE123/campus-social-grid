-- Add missing columns to conversations table
ALTER TABLE public.conversations 
ADD COLUMN user1_id UUID REFERENCES auth.users(id),
ADD COLUMN user2_id UUID REFERENCES auth.users(id);

-- Update existing conversations to populate these columns from conversation_participants
-- First, let's create a temporary function to migrate existing data
CREATE OR REPLACE FUNCTION migrate_conversations()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  conv_record RECORD;
  participants UUID[];
BEGIN
  FOR conv_record IN SELECT id FROM conversations WHERE user1_id IS NULL
  LOOP
    -- Get participants for this conversation
    SELECT ARRAY_AGG(user_id) INTO participants
    FROM conversation_participants 
    WHERE conversation_id = conv_record.id
    LIMIT 2;
    
    -- Update conversation with first two participants
    IF array_length(participants, 1) >= 2 THEN
      UPDATE conversations 
      SET user1_id = participants[1], user2_id = participants[2]
      WHERE id = conv_record.id;
    END IF;
  END LOOP;
END;
$$;

-- Run the migration
SELECT migrate_conversations();

-- Drop the temporary function
DROP FUNCTION migrate_conversations();

-- Add constraints to ensure user1_id and user2_id are not null for new conversations
ALTER TABLE public.conversations 
ALTER COLUMN user1_id SET NOT NULL,
ALTER COLUMN user2_id SET NOT NULL;

-- Add unique constraint to prevent duplicate conversations
ALTER TABLE public.conversations 
ADD CONSTRAINT unique_conversation_users 
UNIQUE (user1_id, user2_id);

-- Update the get_or_create_conversation function to also handle conversation_participants
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  conversation_id UUID;
BEGIN
  -- Try to get existing conversation
  SELECT c.id INTO conversation_id
  FROM conversations c
  WHERE (c.user1_id = user1_id AND c.user2_id = user2_id)
     OR (c.user1_id = user2_id AND c.user2_id = user1_id);

  -- If none exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id)
    VALUES (user1_id, user2_id)
    RETURNING id INTO conversation_id;
    
    -- Also add participants to conversation_participants table
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES 
      (conversation_id, user1_id),
      (conversation_id, user2_id);
  END IF;

  RETURN conversation_id;
END;
$function$