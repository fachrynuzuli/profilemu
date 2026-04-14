import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RichText } from "@/components/ui/rich-text";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  User,
  Loader2,
  Sparkles,
  ArrowDown,
} from "lucide-react";
import { ShareProfileButton, ShareChatButton } from "@/components/ShareButtons";
import { SuggestedQuestions, generateSuggestedQuestions } from "@/components/SuggestedQuestions";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface ContextItem {
  category: string;
  title: string;
  content: string;
}

const PublicProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);

  const { sendStreamingMessage, streamingContent, isStreaming } = useStreamingChat({
    slug: slug || "",
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response. Please try again.",
      });
    },
  });
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (slug) fetchProfile();
  }, [slug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const fetchProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, bio, avatar_url, user_id")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (profileError || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile({
        display_name: profileData.display_name,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
      });

      // Fetch AI context for suggested questions & expertise tags
      try {
        const { data: contextData } = await supabase.functions.invoke(
          "get-profile-context",
          { body: { slug } }
        );

        if (contextData?.contexts) {
          const questions = generateSuggestedQuestions(
            contextData.contexts,
            profileData.display_name || undefined
          );
          setSuggestedQuestions(questions);

          // Extract expertise area titles for tags
          const areas = contextData.contexts
            .filter((c: ContextItem) => c.category === "expertise_areas")
            .map((c: ContextItem) => c.title);
          setExpertiseTags(areas);
        }

        // Use custom greeting or generate default
        const customGreeting = contextData?.greeting_message;
        const greetingText = customGreeting
          || `Hi! I'm ${profileData.display_name || "here"}'s AI twin. ${profileData.bio ? profileData.bio + " " : ""}Feel free to ask me anything!`;

        setMessages([{ role: "assistant", content: greetingText }]);
      } catch {
        setSuggestedQuestions([
          `What does ${profileData.display_name || "this person"} specialize in?`,
          `Tell me about ${profileData.display_name || "their"}'s background`,
          `How can ${profileData.display_name || "they"} help me?`,
        ]);

        // Default greeting on error
        setMessages([{
          role: "assistant",
          content: `Hi! I'm ${profileData.display_name || "here"}'s AI twin. ${profileData.bio ? profileData.bio + " " : ""}Feel free to ask me anything!`,
        }]);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching profile:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const scrollToChat = () => {
    chatSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => inputRef.current?.focus(), 600);
  };

  const sendMessage = async (messageText?: string) => {
    const message = messageText || inputValue.trim();
    if (!message || isStreaming) return;

    setInputValue("");
    setShowSuggestions(false);

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: message },
    ];
    setMessages(newMessages);

    const conversationHistory = newMessages.slice(1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await sendStreamingMessage(
      message,
      conversationHistory.slice(0, -1)
    );

    if (result) {
      setMessages((prev) => [...prev, { role: "assistant", content: result }]);
    } else if (!result) {
      setMessages(messages);
    }
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        
        <Card
          variant="elevated"
          className="p-8 text-center max-w-md mx-4 relative z-10"
        >
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="font-display text-2xl mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This profile doesn't exist or hasn't been published yet.
          </p>
          <Link to="/">
            <Button variant="soft" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const displayName = profile?.display_name || "AI Twin";

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      

      {/* Minimal top bar */}
      <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/30">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-4xl">
          <Link to="/" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <MessageCircle className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-display text-sm">Profile.Mu</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <ShareProfileButton
              slug={slug || ""}
              displayName={profile?.display_name || undefined}
            />
            <ShareChatButton
              messages={messages}
              displayName={profile?.display_name || undefined}
            />
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative z-10 overflow-hidden">
        {/* Decorative glow */}
        

        <div className="container mx-auto px-4 max-w-4xl pt-12 pb-10 md:pt-16 md:pb-14">
          <div className="flex flex-col items-center text-center animate-fade-in">
            {/* Avatar */}
            <div className="relative mb-6 group">
              <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-[3px] border-background shadow-lg-token overflow-hidden bg-muted">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <User className="w-14 h-14 text-primary/60" />
                  </div>
                )}
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-background" />
            </div>

            {/* Name */}
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl mb-3 tracking-tight">
              {displayName}
            </h1>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-muted-foreground text-base md:text-lg max-w-lg leading-relaxed mb-6">
                {profile.bio}
              </p>
            )}

            {/* Expertise Tags */}
            {expertiseTags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-md">
                {expertiseTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-3 py-1 text-xs font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/12 transition-colors"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* CTA */}
            <Button
              onClick={scrollToChat}
              size="lg"
              className="gap-2.5 rounded-full px-8 transition-all duration-300 group"
            >
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Chat with {displayName.split(" ")[0]}'s AI Twin
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </section>

      {/* ===== CHAT SECTION ===== */}
      <section ref={chatSectionRef} className="relative z-10">
        <div className="container mx-auto px-4 max-w-3xl py-8 md:py-10">
          {/* Section label */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/10">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl">Ask me anything</h2>
              <p className="text-xs text-muted-foreground">
                Powered by AI · Responds as {displayName}
              </p>
            </div>
          </div>

          {/* Suggested Questions */}
          {showSuggestions && suggestedQuestions.length > 0 && (
            <div className="mb-6">
              <SuggestedQuestions
                questions={suggestedQuestions}
                onSelect={handleSuggestedQuestion}
                displayName={profile?.display_name || undefined}
              />
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4 mb-4 min-h-[200px]">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""} animate-fade-in`}
              >
                {/* Avatar bubble */}
                {msg.role === "assistant" && (
                  <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-primary/10 mt-0.5 border border-border/50">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border/50 rounded-bl-md"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-sm md:text-base whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  ) : (
                    <RichText
                      content={msg.content}
                      className="text-sm md:text-base"
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {isStreaming && (
              <div className="flex gap-3 animate-fade-in">
                <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-primary/10 mt-0.5 border border-border/50">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>
                <div className="max-w-[80%] md:max-w-[70%] bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                  {streamingContent ? (
                    <div className="relative">
                      <RichText
                        content={streamingContent}
                        className="text-sm md:text-base"
                      />
                      <span className="inline-block w-1.5 h-4 bg-primary/60 rounded-full animate-pulse ml-0.5 align-text-bottom" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl py-4 -mx-4 px-4 border-t border-border/30">
            <div className="flex gap-2 max-w-3xl mx-auto">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask ${displayName.split(" ")[0]} anything...`}
                disabled={isStreaming}
                className="flex-1 rounded-full px-5 h-11 bg-card border-border/50"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || isStreaming}
                size="icon"
                className="shrink-0 rounded-full w-11 h-11"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 border-t border-border/30">
        <Link
          to="/"
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          Powered by Profile.Mu
        </Link>
      </footer>
    </div>
  );
};

export default PublicProfile;
