import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Target, ShieldAlert, Plus, X, ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";

interface ExpertiseEntry {
  title: string;
  content: string;
}

interface ExpertiseWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (expertiseAreas: ExpertiseEntry[], boundaries: ExpertiseEntry[]) => Promise<void>;
}

const EXPERTISE_EXAMPLES: ExpertiseEntry[] = [
  { title: "Product Management", content: "Roadmap planning, feature prioritization, stakeholder communication, and agile methodologies" },
  { title: "React Development", content: "Building modern web applications with React, TypeScript, and component architecture" },
  { title: "Startup Strategy", content: "Go-to-market planning, fundraising, pitch decks, and early-stage growth tactics" },
];

const BOUNDARY_EXAMPLES: ExpertiseEntry[] = [
  { title: "Legal Advice", content: "I'm not a lawyer - for legal matters, please consult a qualified attorney" },
  { title: "Medical Recommendations", content: "Health questions should be directed to healthcare professionals" },
  { title: "Financial Investment Advice", content: "For investment decisions, please consult a licensed financial advisor" },
];

export function ExpertiseWizard({ open, onOpenChange, onComplete }: ExpertiseWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expertiseAreas, setExpertiseAreas] = useState<ExpertiseEntry[]>([
    { title: "", content: "" }
  ]);
  const [boundaries, setBoundaries] = useState<ExpertiseEntry[]>([
    { title: "", content: "" }
  ]);

  const addExpertise = () => {
    setExpertiseAreas([...expertiseAreas, { title: "", content: "" }]);
  };

  const removeExpertise = (index: number) => {
    if (expertiseAreas.length > 1) {
      setExpertiseAreas(expertiseAreas.filter((_, i) => i !== index));
    }
  };

  const updateExpertise = (index: number, field: keyof ExpertiseEntry, value: string) => {
    const updated = [...expertiseAreas];
    updated[index][field] = value;
    setExpertiseAreas(updated);
  };

  const addBoundary = () => {
    setBoundaries([...boundaries, { title: "", content: "" }]);
  };

  const removeBoundary = (index: number) => {
    if (boundaries.length > 1) {
      setBoundaries(boundaries.filter((_, i) => i !== index));
    }
  };

  const updateBoundary = (index: number, field: keyof ExpertiseEntry, value: string) => {
    const updated = [...boundaries];
    updated[index][field] = value;
    setBoundaries(updated);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const validExpertise = expertiseAreas.filter(e => e.title.trim() && e.content.trim());
      const validBoundaries = boundaries.filter(b => b.title.trim() && b.content.trim());
      await onComplete(validExpertise, validBoundaries);
      onOpenChange(false);
      // Reset state
      setStep(1);
      setExpertiseAreas([{ title: "", content: "" }]);
      setBoundaries([{ title: "", content: "" }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedStep1 = expertiseAreas.some(e => e.title.trim() && e.content.trim());
  const canProceedStep2 = boundaries.some(b => b.title.trim() && b.content.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    s === step ? "bg-primary" : s < step ? "bg-primary/50" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">Step {step} of 3</span>
          </div>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {step === 1 && <><Target className="w-5 h-5 text-primary" /> Define Your Expertise Areas</>}
            {step === 2 && <><ShieldAlert className="w-5 h-5 text-amber-500" /> Set Knowledge Boundaries</>}
            {step === 3 && <><Sparkles className="w-5 h-5 text-primary" /> Review & Confirm</>}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "List the topics where you can answer confidently and in-depth."}
            {step === 2 && "List topics where your AI should politely acknowledge it's not your specialty."}
            {step === 3 && "Review your expertise setup before saving."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Step 1: Expertise Areas */}
          {step === 1 && (
            <>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">💡 Tip:</strong> Be specific! Instead of "technology", try "Cloud architecture with AWS and containerization".
                </p>
              </div>

              <div className="space-y-4">
                {expertiseAreas.map((area, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border bg-card/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Expertise #{index + 1}</Label>
                      {expertiseAreas.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeExpertise(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="e.g., Product Management"
                      value={area.title}
                      onChange={(e) => updateExpertise(index, "title", e.target.value)}
                    />
                    <Textarea
                      placeholder="Describe what you know about this topic..."
                      value={area.content}
                      onChange={(e) => updateExpertise(index, "content", e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}
              </div>

              <Button variant="soft" onClick={addExpertise} className="w-full gap-2">
                <Plus className="w-4 h-4" /> Add Another Expertise
              </Button>

              <div className="pt-2">
                <p className="text-sm font-medium mb-2 text-muted-foreground">Examples:</p>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_EXAMPLES.map((ex, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const emptyIndex = expertiseAreas.findIndex(e => !e.title.trim());
                        if (emptyIndex >= 0) {
                          updateExpertise(emptyIndex, "title", ex.title);
                          updateExpertise(emptyIndex, "content", ex.content);
                        } else {
                          setExpertiseAreas([...expertiseAreas, ex]);
                        }
                      }}
                    >
                      + {ex.title}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Boundaries */}
          {step === 2 && (
            <>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">💡 Tip:</strong> This helps your AI be honest and trustworthy by acknowledging its limits.
                </p>
              </div>

              <div className="space-y-4">
                {boundaries.map((boundary, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border bg-card/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Boundary #{index + 1}</Label>
                      {boundaries.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeBoundary(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="e.g., Legal Advice"
                      value={boundary.title}
                      onChange={(e) => updateBoundary(index, "title", e.target.value)}
                    />
                    <Textarea
                      placeholder="How should your AI respond when asked about this?"
                      value={boundary.content}
                      onChange={(e) => updateBoundary(index, "content", e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}
              </div>

              <Button variant="soft" onClick={addBoundary} className="w-full gap-2">
                <Plus className="w-4 h-4" /> Add Another Boundary
              </Button>

              <div className="pt-2">
                <p className="text-sm font-medium mb-2 text-muted-foreground">Examples:</p>
                <div className="flex flex-wrap gap-2">
                  {BOUNDARY_EXAMPLES.map((ex, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const emptyIndex = boundaries.findIndex(b => !b.title.trim());
                        if (emptyIndex >= 0) {
                          updateBoundary(emptyIndex, "title", ex.title);
                          updateBoundary(emptyIndex, "content", ex.content);
                        } else {
                          setBoundaries([...boundaries, ex]);
                        }
                      }}
                    >
                      + {ex.title}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Your Expertise Areas ({expertiseAreas.filter(e => e.title.trim()).length})
                </h4>
                <div className="space-y-2">
                  {expertiseAreas.filter(e => e.title.trim()).map((area, i) => (
                    <div key={i} className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="font-medium text-sm">{area.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{area.content}</p>
                    </div>
                  ))}
                  {expertiseAreas.filter(e => e.title.trim()).length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No expertise areas defined</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  Knowledge Boundaries ({boundaries.filter(b => b.title.trim()).length})
                </h4>
                <div className="space-y-2">
                  {boundaries.filter(b => b.title.trim()).map((boundary, i) => (
                    <div key={i} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <p className="font-medium text-sm">{boundary.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{boundary.content}</p>
                    </div>
                  ))}
                  {boundaries.filter(b => b.title.trim()).length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No boundaries defined</p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-medium mb-2">How your AI will respond to boundary topics:</p>
                <p className="text-sm text-muted-foreground italic">
                  "That's actually outside my area of expertise. I specialize in {expertiseAreas.filter(e => e.title.trim()).map(e => e.title).join(", ") || "specific topics"}. For that question, I'd recommend consulting a specialist."
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {step > 1 ? "Back" : "Cancel"}
          </Button>

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? "Saving..." : "Save & Complete"} <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
