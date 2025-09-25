
import React, { useState } from 'react';
import { Image, MapPin, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import HashtagSelector from './HashtagSelector';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreatePostProps {
  onPostCreated?: () => void | Promise<void>;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    if (!user || !content.trim()) return;

    setIsPosting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          hashtags: hashtags.length > 0 ? hashtags : null
        });

      if (error) throw error;

      // Reset form
      setContent('');
      setHashtags([]);
      toast.success('Post created successfully!');
      
      // Call the callback to refresh posts
      if (onPostCreated) {
        await onPostCreated();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 mb-6">
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">
            {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </span>
        </div>
        <div className="flex-1">
          <Textarea
            placeholder="What's happening in your university?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none bg-transparent border-none p-0 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
          />
          
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Add Hashtags
              </label>
              <HashtagSelector hashtags={hashtags} onHashtagsChange={setHashtags} />
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted/50">
                <Image className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted/50">
                <MapPin className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted/50">
                <Smile className="w-5 h-5" />
              </Button>
            </div>
            <Button 
              onClick={handlePost}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!content.trim() || isPosting}
            >
              {isPosting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
