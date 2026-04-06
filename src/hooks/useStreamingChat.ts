import { useState, useCallback, useRef } from "react";

interface UseStreamingChatOptions {
  slug: string;
  onError?: (error: string) => void;
}

export function useStreamingChat({ slug, onError }: UseStreamingChatOptions) {
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendStreamingMessage = useCallback(
    async (
      message: string,
      conversationHistory: Array<{ role: string; content: string }>
    ): Promise<string | null> => {
      setIsStreaming(true);
      setStreamingContent("");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/chat-with-twin`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
              apikey: supabaseKey,
            },
            body: JSON.stringify({
              slug,
              message,
              conversationHistory,
              stream: true,
            }),
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullContent = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                setStreamingContent(fullContent);
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        setIsStreaming(false);
        setStreamingContent("");
        return fullContent || null;
      } catch (error: any) {
        if (error.name === "AbortError") {
          setIsStreaming(false);
          return null;
        }
        console.error("Streaming error:", error);
        onError?.(error.message);
        setIsStreaming(false);
        setStreamingContent("");
        return null;
      }
    },
    [slug, onError]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendStreamingMessage, streamingContent, isStreaming, abort };
}
