import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RichText } from "@/components/ui/rich-text";
import {
  MessageSquare,
  ChevronLeft,
  Clock,
  User,
  Bot,
  Inbox,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  visitor_id: string | null;
  messages_count: number;
  started_at: string;
  last_message_at: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ConversationHistoryProps {
  profileId: string | undefined;
}

export function ConversationHistory({ profileId }: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (profileId) fetchConversations();
  }, [profileId]);

  const fetchConversations = async () => {
    if (!profileId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("profile_id", profileId)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    setSelectedConversation(conversationId);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleBack = () => {
    setSelectedConversation(null);
    setMessages([]);
  };

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Conversation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Message detail view
  if (selectedConversation) {
    const conv = conversations.find((c) => c.id === selectedConversation);
    return (
      <Card variant="elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Conversation
              </CardTitle>
              {conv && (
                <CardDescription className="text-xs mt-0.5">
                  {formatDistanceToNow(new Date(conv.started_at), { addSuffix: true })}
                  {" · "}
                  {messages.length} messages
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoadingMessages ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-12 bg-muted rounded-lg" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages stored for this conversation.</p>
              <p className="text-xs mt-1">Messages are saved for new conversations going forward.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-3">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "" : ""}`}
                  >
                    <div
                      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
                        msg.role === "user"
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {msg.role === "user" ? "Visitor" : "AI Twin"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {msg.role === "assistant" ? (
                        <RichText content={msg.content} className="text-sm" />
                      ) : (
                        <p className="text-sm text-foreground/90">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    );
  }

  // Conversations list view
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Conversation History
        </CardTitle>
        <CardDescription>
          Browse what visitors are asking your AI twin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No conversations yet.</p>
            <p className="text-sm mt-1">Share your profile to start getting visitors!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => fetchMessages(conv.id)}
                className="w-full text-left p-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <MessageSquare className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        Visitor {conv.visitor_id ? `#${conv.visitor_id.slice(0, 8)}` : ""}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                        <span>·</span>
                        <span>{conv.messages_count} msgs</span>
                      </div>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
