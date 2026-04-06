import { useState, useEffect } from "react";
import { RichText } from "./rich-text";

interface TypingTextProps {
  content: string;
  className?: string;
  speed?: number;
  onComplete?: () => void;
}

export function TypingText({ content, className, speed = 12, onComplete }: TypingTextProps) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (displayedLength < content.length) {
      const timeout = setTimeout(() => {
        // Advance by chunks for smoother feel
        const remaining = content.length - displayedLength;
        const chunk = remaining > 100 ? Math.min(3, remaining) : 1;
        setDisplayedLength((prev) => Math.min(prev + chunk, content.length));
      }, speed);
      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [displayedLength, content.length, speed, isComplete, onComplete]);

  const visibleContent = content.slice(0, displayedLength);

  return (
    <div className="relative">
      <RichText content={visibleContent} className={className} />
      {!isComplete && (
        <span className="inline-block w-1.5 h-4 bg-primary/60 rounded-full animate-pulse ml-0.5 align-text-bottom" />
      )}
    </div>
  );
}
