import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RichText } from "@/components/ui/rich-text";
import { TypingText } from "@/components/ui/typing-text";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, ArrowLeft, User, Loader2 } from "lucide-react";
import { ShareProfileButton, ShareChatButton } from "@/components/ShareButtons";
import { SuggestedQuestions, generateSuggestedQuestions } from "@/components/SuggestedQuestions";

interface Message {
  role: 'user' | 'assistant';
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
  const [isSending, setIsSending] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (slug) {
      fetchProfile();
    }
  }, [slug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchProfile = async () => {
    try {
      // Fetch profile
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

      // Fetch AI context for suggested questions (using service role through edge function)
      try {
        const { data: contextData } = await supabase.functions.invoke('get-profile-context', {
          body: { slug }
        });
        
        if (contextData?.contexts) {
          const questions = generateSuggestedQuestions(
            contextData.contexts,
            profileData.display_name || undefined
          );
          setSuggestedQuestions(questions);
        }
      } catch (e) {
        // Fallback questions if context fetch fails
        setSuggestedQuestions([
          `What does ${profileData.display_name || 'this person'} specialize in?`,
          `Tell me about ${profileData.display_name || 'their'}'s background`,
          `How can ${profileData.display_name || 'they'} help me?`,
        ]);
      }

      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm ${profileData.display_name || 'here'}'s AI twin. ${profileData.bio ? profileData.bio + ' ' : ''}Feel free to ask me anything!`
      }]);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const message = messageText || inputValue.trim();
    if (!message || isSending) return;

    setInputValue("");
    setIsSending(true);
    setShowSuggestions(false); // Hide suggestions after first message

    // Add user message to chat
    const newMessages: Message[] = [...messages, { role: 'user', content: message }];
    setMessages(newMessages);

    try {
      // Prepare conversation history (excluding the welcome message for cleaner context)
      const conversationHistory = newMessages.slice(1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const { data, error } = await supabase.functions.invoke('chat-with-twin', {
        body: {
          slug,
          message: message,
          conversationHistory: conversationHistory.slice(0, -1) // Exclude the message we just added
        }
      });

      if (error) throw error;

      // Add AI response
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response. Please try again."
      });
      // Remove the user message if we failed
      setMessages(messages);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
        <div className="fixed inset-0 gradient-mesh opacity-30 pointer-events-none" />
        <Card variant="elevated" className="p-8 text-center max-w-md mx-4 relative z-10">
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 gradient-mesh opacity-30 pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center shadow-soft">
              <MessageCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl">Profile.Mu</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Share buttons */}
            <ShareProfileButton slug={slug || ""} displayName={profile?.display_name || undefined} />
            <ShareChatButton messages={messages} displayName={profile?.display_name || undefined} />

            {/* Profile info */}
            <div className="flex items-center gap-3 ml-2 pl-2 border-l border-border/50">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.display_name || "Profile"} 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              <span className="font-medium hidden sm:block">{profile?.display_name || "AI Twin"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col relative z-10 max-w-3xl">
        {/* Profile Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center shadow-soft">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.display_name || "Profile"} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-primary" />
            )}
          </div>
          <h1 className="font-display text-2xl md:text-3xl mb-1">
            Chat with {profile?.display_name || "AI Twin"}
          </h1>
          {profile?.bio && (
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Suggested Questions */}
        {showSuggestions && suggestedQuestions.length > 0 && (
          <SuggestedQuestions
            questions={suggestedQuestions}
            onSelect={handleSuggestedQuestion}
            displayName={profile?.display_name || undefined}
          />
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border/50 shadow-card rounded-bl-md'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm md:text-base whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <RichText content={msg.content} className="text-sm md:text-base" />
                )}
              </div>
            </div>
          ))}
          
          {isSending && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-card border border-border/50 shadow-card rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg py-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask ${profile?.display_name || 'them'} anything...`}
              disabled={isSending}
              className="flex-1"
            />
            <Button 
              onClick={() => sendMessage()} 
              disabled={!inputValue.trim() || isSending}
              size="icon"
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicProfile;
