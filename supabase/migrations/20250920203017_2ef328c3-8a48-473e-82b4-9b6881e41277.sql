-- Phase 1: Professional Chat System - Message Status & Real-time Features

-- 1. Message Status System (Instagram/WhatsApp style)
CREATE TABLE IF NOT EXISTS public.message_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- 2. Typing Indicators (Real-time typing status)
CREATE TABLE IF NOT EXISTS public.typing_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_typing boolean NOT NULL DEFAULT false,
  last_activity timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- 3. User Presence (Online/Offline status like Instagram)
CREATE TABLE IF NOT EXISTS public.user_presence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  is_online boolean NOT NULL DEFAULT false,
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  status text DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Message Reactions (Instagram-style hearts, likes)
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'heart' CHECK (reaction_type IN ('heart', 'like', 'laugh', 'wow', 'sad', 'angry')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- 5. Message Replies (Twitter-style threaded messages)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reply_to_message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'reply')),
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type text;

-- 6. Enhanced conversations with last activity
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS last_activity timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_message_id uuid REFERENCES public.messages(id),
ADD COLUMN IF NOT EXISTS unread_count_user1 integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS unread_count_user2 integer DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.message_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_status
CREATE POLICY "Users can view message status in their conversations" ON public.message_status
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE m.id = message_status.message_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create message status" ON public.message_status
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message status" ON public.message_status
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for typing_status
CREATE POLICY "Users can view typing status in their conversations" ON public.typing_status
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = typing_status.conversation_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own typing status" ON public.typing_status
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_presence
CREATE POLICY "User presence is viewable by everyone" ON public.user_presence
FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON public.user_presence
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for message_reactions
CREATE POLICY "Users can view reactions in their conversations" ON public.message_reactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE m.id = message_reactions.message_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own reactions" ON public.message_reactions
FOR ALL USING (auth.uid() = user_id);

-- 7. Triggers for automatic status updates

-- Trigger to update conversation last_activity and message
CREATE OR REPLACE FUNCTION public.update_conversation_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.conversations 
  SET 
    last_activity = NEW.created_at,
    last_message_id = NEW.id,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_activity_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_activity();

-- Trigger to auto-create message status for participants
CREATE OR REPLACE FUNCTION public.create_message_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  participant_id uuid;
BEGIN
  -- Create 'delivered' status for all participants except sender
  FOR participant_id IN 
    SELECT cp.user_id 
    FROM public.conversation_participants cp 
    WHERE cp.conversation_id = NEW.conversation_id 
    AND cp.user_id != NEW.sender_id
  LOOP
    INSERT INTO public.message_status (message_id, user_id, status)
    VALUES (NEW.id, participant_id, 'delivered')
    ON CONFLICT (message_id, user_id) DO NOTHING;
  END LOOP;
  
  -- Create 'sent' status for sender
  INSERT INTO public.message_status (message_id, user_id, status)
  VALUES (NEW.id, NEW.sender_id, 'sent')
  ON CONFLICT (message_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_message_status_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_status();

-- Trigger for updating timestamps
CREATE TRIGGER update_typing_status_timestamp
  BEFORE UPDATE ON public.typing_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_presence_timestamp
  BEFORE UPDATE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Functions for professional chat features

-- Function to mark messages as read (WhatsApp/Instagram style)
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
  conversation_uuid uuid,
  reader_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.message_status 
  SET status = 'read', timestamp = now()
  WHERE message_id IN (
    SELECT m.id FROM public.messages m
    WHERE m.conversation_id = conversation_uuid
    AND m.sender_id != reader_user_id
  )
  AND user_id = reader_user_id
  AND status != 'read';
END;
$$;

-- Function to update typing status
CREATE OR REPLACE FUNCTION public.update_typing_status(
  conversation_uuid uuid,
  typing_user_id uuid,
  typing_state boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.typing_status (conversation_id, user_id, is_typing, last_activity)
  VALUES (conversation_uuid, typing_user_id, typing_state, now())
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET 
    is_typing = typing_state,
    last_activity = now(),
    updated_at = now();
END;
$$;

-- Function to update user presence
CREATE OR REPLACE FUNCTION public.update_user_presence(
  target_user_id uuid,
  online_status boolean,
  presence_status text DEFAULT 'online'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_presence (user_id, is_online, status, last_seen)
  VALUES (target_user_id, online_status, presence_status, now())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    is_online = online_status,
    status = presence_status,
    last_seen = CASE WHEN online_status THEN user_presence.last_seen ELSE now() END,
    updated_at = now();
END;
$$;

-- Function to get enhanced conversation list (Instagram-style)
CREATE OR REPLACE FUNCTION public.get_enhanced_conversations(target_user_id uuid)
RETURNS TABLE(
  conversation_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  other_user_university text,
  last_message text,
  last_message_time timestamptz,
  unread_count integer,
  is_other_user_online boolean,
  last_seen timestamptz,
  is_typing boolean
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
    lm.content AS last_message,
    lm.created_at AS last_message_time,
    COALESCE(unread.count, 0)::integer AS unread_count,
    COALESCE(up.is_online, false) AS is_other_user_online,
    up.last_seen AS last_seen,
    COALESCE(ts.is_typing, false) AS is_typing
  FROM public.conversations c
  JOIN public.profiles p ON (
    (c.user1_id = target_user_id AND p.user_id = c.user2_id) OR 
    (c.user2_id = target_user_id AND p.user_id = c.user1_id)
  )
  LEFT JOIN public.messages lm ON lm.id = c.last_message_id
  LEFT JOIN (
    SELECT 
      m.conversation_id,
      COUNT(*) as count
    FROM public.messages m
    JOIN public.message_status ms ON m.id = ms.message_id
    WHERE ms.user_id = target_user_id 
    AND ms.status != 'read'
    AND m.sender_id != target_user_id
    GROUP BY m.conversation_id
  ) unread ON unread.conversation_id = c.id
  LEFT JOIN public.user_presence up ON up.user_id = (
    CASE 
      WHEN c.user1_id = target_user_id THEN c.user2_id 
      ELSE c.user1_id 
    END
  )
  LEFT JOIN public.typing_status ts ON ts.conversation_id = c.id 
    AND ts.user_id = (
      CASE 
        WHEN c.user1_id = target_user_id THEN c.user2_id 
        ELSE c.user1_id 
      END
    )
    AND ts.last_activity > now() - interval '10 seconds'
  WHERE (c.user1_id = target_user_id OR c.user2_id = target_user_id)
  ORDER BY COALESCE(c.last_activity, c.created_at) DESC;
END;
$$;