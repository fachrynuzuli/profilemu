import { MessageCircle } from "lucide-react";

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  displayName?: string;
}

export function SuggestedQuestions({ questions, onSelect, displayName }: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MessageCircle className="w-4 h-4" />
        <span>Suggested questions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelect(question)}
            className="px-4 py-2 text-sm bg-card border border-border/50 rounded-full hover:bg-primary/10 hover:border-primary/30 transition-all text-left"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

// Helper function to generate questions based on context
export function generateSuggestedQuestions(
  contexts: Array<{ category: string; title: string; content: string }>,
  displayName?: string
): string[] {
  const questions: string[] = [];
  const name = displayName || "you";

  // Group contexts by category
  const categories = new Set(contexts.map(c => c.category.toLowerCase()));

  // Generate questions based on available context
  if (categories.has("career") || categories.has("experience")) {
    questions.push(`What's ${name}'s professional background?`);
  }

  if (categories.has("skills") || categories.has("expertise")) {
    questions.push(`What technologies does ${name} work with?`);
  }

  if (categories.has("projects") || categories.has("work")) {
    const projectContext = contexts.find(c => 
      c.category.toLowerCase() === "projects" || c.category.toLowerCase() === "work"
    );
    if (projectContext) {
      questions.push(`Tell me about ${projectContext.title}`);
    }
  }

  if (categories.has("education") || categories.has("background")) {
    questions.push(`What's ${name}'s educational background?`);
  }

  // Fallback generic questions
  if (questions.length < 2) {
    questions.push(`What does ${name} specialize in?`);
    questions.push(`How can ${name} help me?`);
  }

  // Limit to 3 questions
  return questions.slice(0, 3);
}
