import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  reply_to_message_id?: string;
  message_type: 'text' | 'image' | 'file' | 'reply';
  media_url?: string;
  media_type?: string;
  status?: 'sent' | 'delivered' | 'read';
  reactions?: any[];
}

interface MessageInputProps {
  onSendMessage: (
    content: string, 
    messageType?: 'text' | 'image' | 'file' | 'reply',
    replyToMessageId?: string,
    mediaUrl?: string,
    mediaType?: string
  ) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  replyToMessage?: EnhancedMessage;
  onCancelReply?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function MessageInput({
  onSendMessage,
  onTyping,
  replyToMessage,
  onCancelReply,
  placeholder = "Type your message...",
  disabled = false
}: MessageInputProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleTyping = useCallback((content: string) => {
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing if there's content
    if (content.trim()) {
      onTyping(true);
      
      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 3000);
    } else {
      onTyping(false);
    }
  }, [onTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    handleTyping(value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleSend = async () => {
    if (!message.trim() || disabled || isUploading) return;

    const messageContent = message.trim();
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Stop typing
    onTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      await onSendMessage(
        messageContent,
        replyToMessage ? 'reply' : 'text',
        replyToMessage?.id
      );
      
      // Clear reply if exists
      if (replyToMessage && onCancelReply) {
        onCancelReply();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setMessage(messageContent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Here you would implement file upload to Supabase Storage
      // For now, we'll just show a placeholder
      const fileUrl = URL.createObjectURL(file);
      const fileType = file.type;
      
      await onSendMessage(
        file.name,
        file.type.startsWith('image/') ? 'image' : 'file',
        undefined,
        fileUrl,
        fileType
      );
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset file input
    }
  };

  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping(false);
    };
  }, [onTyping]);

  return (
    <div className="border-t border-border bg-background">
      {/* Reply preview */}
      {replyToMessage && (
        <div className="p-3 bg-muted/30 border-l-2 border-primary/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Replying to {replyToMessage.sender_id === user?.id ? 'yourself' : 'message'}
              </span>
            </div>
            {onCancelReply && (
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={onCancelReply}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-foreground/70 mt-1 truncate">
            {replyToMessage.content}
          </p>
        </div>
      )}

      {/* Message input */}
      <div className="p-4">
        <div className="flex items-end gap-2">
          {/* File upload button */}
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              disabled={disabled || isUploading}
            />
            <Button
              variant="ghost"
              size="icon"
              asChild
              disabled={disabled || isUploading}
              className="text-muted-foreground hover:text-foreground"
            >
              <label htmlFor="file-upload" className="cursor-pointer">
                <Paperclip className="w-4 h-4" />
              </label>
            </Button>
          </div>

          {/* Text input */}
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              placeholder={placeholder}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              disabled={disabled}
              className="min-h-[40px] max-h-[120px] resize-none bg-muted/50 border-muted text-foreground placeholder:text-muted-foreground focus:border-primary"
              rows={1}
            />
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled || isUploading}
            size="icon"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}