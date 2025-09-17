-- Add missing columns to conversations table (without constraints first)
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS user1_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS user2_id UUID REFERENCES auth.users(id);

-- Update existing conversations to populate these columns from conversation_participants
CREATE OR REPLACE FUNCTION migrate_conversations_safe()
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
    SELECT ARRAY_AGG(user_id ORDER BY user_id) INTO participants
    FROM conversation_participants 
    WHERE conversation_id = conv_record.id
    LIMIT 2;
    
    -- Update conversation with participants (order them to be consistent)
    IF array_length(participants, 1) >= 2 THEN
      UPDATE conversations 
      SET user1_id = participants[1], user2_id = participants[2]
      WHERE id = conv_record.id;
    ELSIF array_length(participants, 1) = 1 THEN
      -- Single participant conversation, duplicate the user
      UPDATE conversations 
      SET user1_id = participants[1], user2_id = participants[1]
      WHERE id = conv_record.id;
    END IF;
  END LOOP;
END;
$$;

-- Run the migration
SELECT migrate_conversations_safe();

-- Clean up duplicate conversations (keep the oldest one)
WITH duplicates AS (
  SELECT 
    id,
    user1_id,
    user2_id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        LEAST(user1_id, user2_id), 
        GREATEST(user1_id, user2_id) 
      ORDER BY created_at ASC
    ) as rn
  FROM conversations 
  WHERE user1_id IS NOT NULL AND user2_id IS NOT NULL
)
DELETE FROM conversations 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint with a function to handle both directions
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
$$ LANGUAGE plpgsql;

-- Create trigger to ensure consistent ordering
DROP TRIGGER IF EXISTS ensure_user_order_trigger ON conversations;
CREATE TRIGGER ensure_user_order_trigger
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION ensure_user_order();

-- Update existing rows to follow the ordering
UPDATE conversations 
SET user1_id = user2_id, user2_id = user1_id 
WHERE user1_id > user2_id;

-- Now add the unique constraint
ALTER TABLE public.conversations 
ADD CONSTRAINT unique_conversation_users 
UNIQUE (user1_id, user2_id);

-- Drop the temporary function
DROP FUNCTION migrate_conversations_safe();