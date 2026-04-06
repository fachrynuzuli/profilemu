import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RichText } from "@/components/ui/rich-text";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { Send, Loader2, User, MessageCircle, X, Minus } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

const EmbedChat = () => {
  const { slug } = useParams<{ slug: string }>();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const { sendStreamingMessage, streamingContent, isStreaming } = useStreamingChat({
    slug: slug || "",
    onError: () => {},
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check URL params for auto-open and theme
  const params = new URLSearchParams(window.location.search);
  const autoOpen = params.get("open") === "true";
  const position = params.get("position") || "right";

  useEffect(() => {
    if (autoOpen) setIsOpen(true);
  }, [autoOpen]);

  useEffect(() => {
    if (slug) fetchProfile();
  }, [slug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("display_name, bio, avatar_url")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch greeting
      try {
        const { data: contextData } = await supabase.functions.invoke("get-profile-context", {
          body: { slug },
        });
        const greeting =
          contextData?.greeting_message ||
          `Hi! I'm ${profileData.display_name || "here"}'s AI twin. Ask me anything!`;
        setMessages([{ role: "assistant", content: greeting }]);
      } catch {
        setMessages([
          { role: "assistant", content: `Hi! I'm ${profileData.display_name || "here"}'s AI twin. Ask me anything!` },
        ]);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const message = messageText || inputValue.trim();
    if (!message || isStreaming) return;

    setInputValue("");
    const newMessages: Message[] = [...messages, { role: "user", content: message }];
    setMessages(newMessages);

    const conversationHistory = newMessages.slice(1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await sendStreamingMessage(message, conversationHistory.slice(0, -1));
    if (result) {
      setMessages((prev) => [...prev, { role: "assistant", content: result }]);
    } else {
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

  if (loading) {
    return (
      <div className="embed-root">
        <style>{embedStyles(position)}</style>
        <div className="embed-fab">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#fff" }} />
        </div>
      </div>
    );
  }

  if (notFound) return null;

  const displayName = profile?.display_name || "AI Twin";

  return (
    <div className="embed-root">
      <style>{embedStyles(position)}</style>

      {/* Chat window */}
      {isOpen && !minimized && (
        <div className="embed-window">
          {/* Header */}
          <div className="embed-header">
            <div className="embed-header-info">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="embed-avatar" />
              ) : (
                <div className="embed-avatar embed-avatar-placeholder">
                  <User style={{ width: 16, height: 16, color: "#fff" }} />
                </div>
              )}
              <div>
                <div className="embed-header-name">{displayName}</div>
                <div className="embed-header-status">
                  <span className="embed-status-dot" />
                  AI Twin · Online
                </div>
              </div>
            </div>
            <div className="embed-header-actions">
              <button className="embed-icon-btn" onClick={() => setMinimized(true)}>
                <Minus style={{ width: 16, height: 16 }} />
              </button>
              <button className="embed-icon-btn" onClick={() => setIsOpen(false)}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="embed-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`embed-msg ${msg.role === "user" ? "embed-msg-user" : "embed-msg-assistant"}`}>
                {msg.role === "assistant" && (
                  <div className="embed-msg-avatar">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="embed-avatar-sm" />
                    ) : (
                      <div className="embed-avatar-sm embed-avatar-placeholder">
                        <User style={{ width: 10, height: 10, color: "#fff" }} />
                      </div>
                    )}
                  </div>
                )}
                <div className={`embed-bubble ${msg.role === "user" ? "embed-bubble-user" : "embed-bubble-assistant"}`}>
                  {msg.role === "user" ? (
                    <span>{msg.content}</span>
                  ) : (
                    <RichText content={msg.content} className="text-sm" />
                  )}
                </div>
              </div>
            ))}

            {isStreaming && (
              <div className="embed-msg embed-msg-assistant">
                <div className="embed-msg-avatar">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="embed-avatar-sm" />
                  ) : (
                    <div className="embed-avatar-sm embed-avatar-placeholder">
                      <User style={{ width: 10, height: 10, color: "#fff" }} />
                    </div>
                  )}
                </div>
                <div className="embed-bubble embed-bubble-assistant">
                  {streamingContent ? (
                    <RichText content={streamingContent} className="text-sm" />
                  ) : (
                    <span className="embed-thinking">
                      <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                      Thinking...
                    </span>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="embed-input-area">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask ${displayName.split(" ")[0]} anything...`}
              disabled={isStreaming}
              className="embed-input"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isStreaming}
              className="embed-send-btn"
            >
              <Send style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Footer */}
          <a
            href={`${window.location.origin}/p/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="embed-footer"
          >
            Powered by Profile.Mu
          </a>
        </div>
      )}

      {/* FAB button */}
      <button
        className="embed-fab"
        onClick={() => {
          if (minimized) {
            setMinimized(false);
          } else {
            setIsOpen(!isOpen);
          }
        }}
      >
        {isOpen && !minimized ? (
          <X style={{ width: 24, height: 24, color: "#fff" }} />
        ) : (
          <>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="embed-fab-avatar" />
            ) : (
              <MessageCircle style={{ width: 24, height: 24, color: "#fff" }} />
            )}
            {minimized && (
              <span className="embed-fab-badge">1</span>
            )}
          </>
        )}
      </button>
    </div>
  );
};

function embedStyles(position: string) {
  const side = position === "left" ? "left" : "right";
  const oppositeSide = position === "left" ? "right" : "left";
  return `
    .embed-root {
      position: fixed;
      bottom: 20px;
      ${side}: 20px;
      ${oppositeSide}: auto;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .embed-window {
      position: absolute;
      bottom: 72px;
      ${side}: 0;
      ${oppositeSide}: auto;
      width: 380px;
      max-width: calc(100vw - 40px);
      height: 520px;
      max-height: calc(100vh - 120px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 12px 60px -8px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: embedSlideUp 0.25s ease-out;
    }
    @keyframes embedSlideUp {
      from { opacity: 0; transform: translateY(12px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .embed-header {
      padding: 14px 16px;
      background: linear-gradient(135deg, hsl(8,85%,65%), hsl(320,70%,55%));
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #fff;
      flex-shrink: 0;
    }
    .embed-header-info { display: flex; align-items: center; gap: 10px; }
    .embed-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.3); }
    .embed-avatar-placeholder { background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; }
    .embed-header-name { font-weight: 600; font-size: 14px; }
    .embed-header-status { font-size: 11px; opacity: 0.85; display: flex; align-items: center; gap: 5px; }
    .embed-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; }
    .embed-header-actions { display: flex; gap: 4px; }
    .embed-icon-btn {
      background: rgba(255,255,255,0.15);
      border: none;
      border-radius: 8px;
      padding: 6px;
      cursor: pointer;
      color: #fff;
      display: flex;
      align-items: center;
      transition: background 0.15s;
    }
    .embed-icon-btn:hover { background: rgba(255,255,255,0.25); }
    .embed-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #fafafa;
    }
    .embed-msg { display: flex; gap: 8px; }
    .embed-msg-user { flex-direction: row-reverse; }
    .embed-msg-avatar { flex-shrink: 0; margin-top: 2px; }
    .embed-avatar-sm { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
    .embed-bubble {
      max-width: 78%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.5;
      word-break: break-word;
    }
    .embed-bubble-user {
      background: hsl(8,85%,65%);
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .embed-bubble-assistant {
      background: #fff;
      color: #1a1a1a;
      border: 1px solid #e5e5e5;
      border-bottom-left-radius: 4px;
    }
    .embed-thinking { display: flex; align-items: center; gap: 6px; color: #999; font-size: 13px; }
    .embed-input-area {
      padding: 12px 16px;
      background: #fff;
      border-top: 1px solid #eee;
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    .embed-input {
      flex: 1;
      border: 1px solid #e0e0e0;
      border-radius: 24px;
      padding: 8px 16px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s;
      background: #fafafa;
    }
    .embed-input:focus { border-color: hsl(8,85%,65%); background: #fff; }
    .embed-input:disabled { opacity: 0.5; }
    .embed-send-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: none;
      background: hsl(8,85%,65%);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.15s, transform 0.1s;
      flex-shrink: 0;
    }
    .embed-send-btn:hover { opacity: 0.9; }
    .embed-send-btn:active { transform: scale(0.95); }
    .embed-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .embed-footer {
      display: block;
      text-align: center;
      padding: 8px;
      font-size: 10px;
      color: #aaa;
      text-decoration: none;
      background: #fff;
      border-top: 1px solid #f0f0f0;
    }
    .embed-footer:hover { color: hsl(8,85%,65%); }
    .embed-fab {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, hsl(8,85%,65%), hsl(320,70%,55%));
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px -4px rgba(0,0,0,0.25);
      transition: transform 0.15s, box-shadow 0.15s;
      position: relative;
      overflow: hidden;
    }
    .embed-fab:hover { transform: scale(1.05); box-shadow: 0 6px 28px -4px rgba(0,0,0,0.3); }
    .embed-fab-avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
    .embed-fab-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #ef4444;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #fff;
    }
    /* Markdown inside bubbles */
    .embed-bubble .prose { font-size: 13px; }
    .embed-bubble .prose p { margin-bottom: 4px; }
    .embed-bubble .prose p:last-child { margin-bottom: 0; }
    .embed-bubble .prose ul, .embed-bubble .prose ol { margin: 4px 0; padding-left: 16px; }
  `;
}

export default EmbedChat;
