import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { RichText } from "@/components/ui/rich-text";
import { Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

const DEMO_SLUG = "fachry";

export function LiveDemoChat() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { sendStreamingMessage, streamingContent, isStreaming } = useStreamingChat({
    slug: DEMO_SLUG,
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble right now. Try again in a moment." },
      ]);
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (messages.length > 1 || streamingContent) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, streamingContent]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, bio, avatar_url")
        .eq("slug", DEMO_SLUG)
        .eq("is_published", true)
        .single();

      if (!error && data) {
        setProfile(data);
        setMessages([
          {
            role: "assistant",
            content: `Hey! I'm ${data.display_name || "Fachry"}. Ask me anything about product management, startups, or my work — I'll answer just like I would in person.`,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    const conversationHistory = newMessages.slice(1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await sendStreamingMessage(userMessage, conversationHistory.slice(0, -1));

    if (result) {
      setMessages((prev) => [...prev, { role: "assistant", content: result }]);
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const displayName = profile?.display_name || "Fachry";

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-background shadow-lg-token">
        <div className="h-[480px] flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background shadow-lg-token overflow-hidden">
      {/* Header — feels like a messaging app */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {displayName.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{displayName}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Online now
          </div>
        </div>
      </div>

      {/* Messages — iMessage-style, no robot icons */}
      <div className="px-4 py-4 h-[380px] overflow-y-auto space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-foreground text-background rounded-[20px] rounded-br-md"
                  : "bg-muted rounded-[20px] rounded-bl-md"
              }`}
            >
              {message.role === "user" ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <RichText content={message.content} className="text-sm" />
              )}
            </div>
          </div>
        ))}

        {/* Streaming */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-4 py-2.5 bg-muted rounded-[20px] rounded-bl-md">
              {streamingContent ? (
                <div className="relative">
                  <RichText content={streamingContent} className="text-sm" />
                  <span className="inline-block w-0.5 h-4 bg-foreground/40 rounded-full animate-pulse ml-0.5 align-text-bottom" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 py-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input — clean, no gradient button */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder={`Message ${displayName}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50 placeholder:text-muted-foreground"
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isStreaming}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 transition-opacity hover:opacity-90 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
