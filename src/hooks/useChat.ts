import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  other_user_university: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export const useChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChatCleared, setIsChatCleared] = useState<boolean>(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [clearedAt, setClearedAt] = useState<string | null>(null);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc("get_user_conversations", {
        target_user_id: user.id,
      });

      if (error) throw error;

      // Filter out conversations deleted by the user
      const { data: deleted } = await supabase
        .from("deleted_chats")
        .select("conversation_id")
        .eq("user_id", user.id);

      const deletedIds = deleted?.map((d) => d.conversation_id) || [];

      setConversations((data || []).filter(
        (conv: Conversation) => !deletedIds.includes(conv.conversation_id)
      ));
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string, offset = 0, limit = 15) => {
    if (!user) return;

    try {
      setActiveConversationId(conversationId);

      // Get cleared timestamp
      const { data: clearedData } = await supabase
        .from("cleared_chats")
        .select("cleared_at")
        .eq("user_id", user.id)
        .eq("conversation_id", conversationId)
        .single();

      if (clearedData?.cleared_at) {
        setIsChatCleared(true);
        setClearedAt(clearedData.cleared_at);
      } else {
        setIsChatCleared(false);
        setClearedAt(null);
      }

      let query = supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId);

      if (clearedData?.cleared_at) {
        query = query.gt("created_at", clearedData.cleared_at);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      if (offset === 0) {
        setCurrentMessages(data?.reverse() || []);
      } else {
        setCurrentMessages((prev) => [...(data?.reverse() || []), ...prev]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (offset === 0) setCurrentMessages([]);
    }
  };

  const loadOlderMessages = async (conversationId: string) => {
    const offset = currentMessages.length;
    await fetchMessages(conversationId, offset);
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user || !content.trim()) {
      return { success: false, error: "No user or empty content" };
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error("Error sending message:", error);
      return { success: false, error: (error as Error).message };
    }
  };

  const createConversation = async (otherUserId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc("get_or_create_conversation", {
        user1_id: user.id,
        user2_id: otherUserId,
      });

      if (error) throw error;
      await fetchConversations();
      return data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  const clearChat = async (conversationId: string) => {
    if (!user) return { success: false, error: "No user" };

    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from("cleared_chats").upsert(
        {
          user_id: user.id,
          conversation_id: conversationId,
          cleared_at: now,
        },
        { onConflict: ["user_id", "conversation_id"] }
      );

      if (error) throw error;

      setIsChatCleared(true);
      setClearedAt(now);
      setCurrentMessages([]);
      return { success: true };
    } catch (error) {
      console.error("Error clearing chat:", error);
      return { success: false, error: (error as Error).message };
    }
  };

  const deleteChat = async (conversationId: string, otherUserId: string) => {
  if (!user) return { success: false, error: "No user" };
  try {
    const now = new Date().toISOString();
    console.log("Deleting chat:", { userId: user.id, conversationId, otherUserId });

    // Check if recent_chats record exists
    const { data: recentChat } = await supabase
      .from("recent_chats")
      .select("id")
      .eq("user_id", user.id)
      .eq("other_user_id", otherUserId)
      .single();

    // Upsert into deleted_chats
    const { error: deletedError } = await supabase.from("deleted_chats").upsert(
      {
        user_id: user.id,
        conversation_id: conversationId,
        deleted_at: now,
      },
      { onConflict: ["user_id", "conversation_id"] }
    );
    if (deletedError) {
      console.error("Deleted chats error:", deletedError);
      throw deletedError;
    }

    // Update recent_chats if it exists
    if (recentChat) {
      const { error: recentError } = await supabase
        .from("recent_chats")
        .update({ deleted_at: now })
        .eq("user_id", user.id)
        .eq("other_user_id", otherUserId);
      if (recentError) {
        console.error("Recent chats error:", recentError);
        throw recentError;
      }
    } else {
      console.warn("No recent chat found for user:", user.id, "other_user:", otherUserId);
    }

    // Update UI
    setConversations((prev) =>
      prev.filter((c) => c.conversation_id !== conversationId)
    );
    if (activeConversationId === conversationId) {
      setCurrentMessages([]);
      setActiveConversationId(null);
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting chat:", JSON.stringify(error, null, 2));
    return { success: false, error: (error as Error).message };
  }
};



  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const msgChannel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;

          if (msg.conversation_id === activeConversationId) {
            if (payload.eventType === "INSERT") {
              if (!clearedAt || msg.created_at > clearedAt) {
                setCurrentMessages((prev) => [...prev, msg]);
              }
            } else if (payload.eventType === "UPDATE") {
              setCurrentMessages((prev) =>
                prev.map((m) => (m.id === msg.id ? msg : m))
              );
            } else if (payload.eventType === "DELETE") {
              setCurrentMessages((prev) =>
                prev.filter((m) => m.id !== payload.old.id)
              );
            }
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [user, activeConversationId, clearedAt]);

  return {
    conversations,
    currentMessages,
    loading,
    isChatCleared,
    fetchMessages,
    loadOlderMessages,
    sendMessage,
    createConversation,
    clearChat,
    deleteChat,
    refreshConversations: fetchConversations,
  };
};
