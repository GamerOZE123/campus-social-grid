-- Add missing columns to recent_chats table that the functions expect
ALTER TABLE public.recent_chats 
ADD COLUMN IF NOT EXISTS other_user_name TEXT,
ADD COLUMN IF NOT EXISTS other_user_university TEXT,
ADD COLUMN IF NOT EXISTS other_user_avatar TEXT;