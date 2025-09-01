-- Create cleared_chats table
CREATE TABLE public.cleared_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  cleared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

-- Enable Row Level Security
ALTER TABLE public.cleared_chats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can create their own cleared chats" 
ON public.cleared_chats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own cleared chats" 
ON public.cleared_chats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cleared chats" 
ON public.cleared_chats 
FOR DELETE 
USING (auth.uid() = user_id);