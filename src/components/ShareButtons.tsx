import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Share2, Link, MessageSquare, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareProfileButtonProps {
  slug: string;
  displayName?: string;
}

export function ShareProfileButton({ slug, displayName }: ShareProfileButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/p/${slug}`;
  const shareTitle = displayName ? `Chat with ${displayName}'s AI Twin` : "Chat with this AI Twin";
  const shareText = `Check out ${displayName || "this person"}'s AI digital twin on Profile.Mu!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Profile link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please copy the link manually",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: profileUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleNativeShare}
      className="gap-2"
    >
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      Share Profile
    </Button>
  );
}

interface ShareChatButtonProps {
  messages: Array<{ role: string; content: string }>;
  displayName?: string;
}

export function ShareChatButton({ messages, displayName }: ShareChatButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const formatConversation = () => {
    const header = `💬 Conversation with ${displayName || "AI Twin"}'s AI on Profile.Mu\n\n`;
    const conversation = messages
      .map((msg) => {
        const prefix = msg.role === "user" ? "👤 You:" : `🤖 ${displayName || "AI"}:`;
        return `${prefix}\n${msg.content}`;
      })
      .join("\n\n---\n\n");
    const footer = `\n\n🔗 Create your own AI twin at profilemu.dev`;
    return header + conversation + footer;
  };

  const handleCopyChat = async () => {
    try {
      await navigator.clipboard.writeText(formatConversation());
      setCopied(true);
      toast({
        title: "Conversation copied!",
        description: "Chat copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try again",
      });
    }
  };

  // Only show if there are actual user messages
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length < 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {copied ? <Check className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          Share Chat
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyChat} className="gap-2">
          <Link className="w-4 h-4" />
          Copy conversation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
