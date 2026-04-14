import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  User,
  Briefcase,
  Target,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

interface OnboardingData {
  displayName: string;
  bio: string;
  slug: string;
  background: string;
  skills: string;
  expertiseAreas: string;
  expertiseBoundaries: string;
  voiceSamples: string;
  communicationStyle: string;
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onClose?: () => void;
}

const STEPS = [
  { id: 1, title: "About you", icon: User, description: "Name and profile URL" },
  { id: 2, title: "Background", icon: Briefcase, description: "Your professional story" },
  { id: 3, title: "Expertise", icon: Target, description: "What you know best" },
  { id: 4, title: "Voice", icon: MessageSquare, description: "How you communicate" },
];

export function OnboardingWizard({ onComplete, onClose }: OnboardingWizardProps) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<OnboardingData>({
    displayName: "",
    bio: "",
    slug: "",
    background: "",
    skills: "",
    expertiseAreas: "",
    expertiseBoundaries: "",
    voiceSamples: "",
    communicationStyle: "",
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 30);
  };

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "displayName" && !prev.slug) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const transitionTo = (nextStep: number, dir: "forward" | "backward") => {
    setDirection(dir);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(nextStep);
      setIsTransitioning(false);
      // Scroll content to top on step change
      contentRef.current?.scrollTo({ top: 0 });
    }, 200);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      transitionTo(currentStep + 1, "forward");
    } else {
      localStorage.setItem("onboarding_data", JSON.stringify(data));
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      transitionTo(currentStep - 1, "backward");
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return data.displayName.trim().length >= 2;
    return true;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">Your name</Label>
              <Input
                id="displayName"
                placeholder="e.g., Fachry Zahirah"
                value={data.displayName}
                onChange={(e) => handleInputChange("displayName", e.target.value)}
                autoFocus
                className="h-12 text-base rounded-xl border-border bg-muted/40 focus:bg-background focus:border-primary/40 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">Short bio</Label>
              <Textarea
                id="bio"
                placeholder="Product leader & startup founder passionate about education technology"
                value={data.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                rows={3}
                className="rounded-xl border-border bg-muted/40 focus:bg-background focus:border-primary/40 transition-all duration-200 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Shows as your headline on your public profile
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-medium">Profile URL</Label>
              <div className="flex items-center gap-0 rounded-xl border border-border bg-muted/40 overflow-hidden focus-within:border-primary/40 focus-within:bg-background transition-all duration-200">
                <span className="text-sm text-muted-foreground pl-3 pr-1 shrink-0 select-none">profilemu.app/</span>
                <input
                  id="slug"
                  placeholder="your-name"
                  value={data.slug}
                  onChange={(e) => handleInputChange("slug", generateSlug(e.target.value))}
                  className="flex-1 bg-transparent py-3 pr-3 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="background" className="text-sm font-medium">Professional background</Label>
              <Textarea
                id="background"
                placeholder="Your career journey, key roles, and accomplishments..."
                value={data.background}
                onChange={(e) => handleInputChange("background", e.target.value)}
                rows={5}
                autoFocus
                className="rounded-xl border-border bg-muted/40 focus:bg-background focus:border-primary/40 transition-all duration-200 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Your AI uses this to answer questions about your experience
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills" className="text-sm font-medium">Key skills</Label>
              <Textarea
                id="skills"
                placeholder="Product Management, React, Python, Data Analysis, UX Design..."
                value={data.skills}
                onChange={(e) => handleInputChange("skills", e.target.value)}
                rows={3}
                className="rounded-xl border-border bg-muted/40 focus:bg-background focus:border-primary/40 transition-all duration-200 resize-none"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="expertiseAreas" className="text-sm font-medium">What are you an expert in?</Label>
              <Textarea
                id="expertiseAreas"
                placeholder="Building SaaS products, Digital transformation in education, Go-to-market strategy..."
                value={data.expertiseAreas}
                onChange={(e) => handleInputChange("expertiseAreas", e.target.value)}
                rows={4}
                autoFocus
                className="rounded-xl border-border bg-muted/40 focus:bg-background focus:border-primary/40 transition-all duration-200 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Your AI will answer these topics confidently
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expertiseBoundaries" className="text-sm font-medium">What's outside your expertise?</Label>
              <Textarea
                id="expertiseBoundaries"
                placeholder="Legal advice, Medical recommendations, Deep backend architecture..."
                value={data.expertiseBoundaries}
                onChange={(e) => handleInputChange("expertiseBoundaries", e.target.value)}
                rows={4}
                className="rounded-xl border-border bg-muted/40 focus:bg-background focus:border-primary/40 transition-all duration-200 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Your AI will politely defer on these topics
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="voiceSamples" className="text-sm font-medium">Writing samples <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                id="voiceSamples"
                placeholder="Paste examples of how you write — emails, tweets, or messages that capture your voice..."
                value={data.voiceSamples}
                onChange={(e) => handleInputChange("voiceSamples", e.target.value)}
                rows={5}
                autoFocus
                className="rounded-xl border-border bg-muted/40 focus:bg-background focus:border-primary/40 transition-all duration-200 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="communicationStyle" className="text-sm font-medium">Communication style</Label>
              <Textarea
                id="communicationStyle"
                placeholder="Friendly but professional, uses humor, keeps things concise, often uses analogies..."
                value={data.communicationStyle}
                onChange={(e) => handleInputChange("communicationStyle", e.target.value)}
                rows={3}
                className="rounded-xl border-border bg-muted/40 focus:bg-background focus:border-primary/40 transition-all duration-200 resize-none"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in-overlay">
      <Card className="w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl rounded-b-none sm:rounded-b-2xl max-h-[92vh] overflow-hidden border-border bg-background shadow-xl-token animate-slide-up-sheet sm:animate-scale-in-modal">
        {/* Header */}
        <CardHeader className="pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-display">Create your AI twin</CardTitle>
              <CardDescription className="text-sm">
                Step {currentStep} of {STEPS.length} · {STEPS[currentStep - 1].description}
              </CardDescription>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* Step indicators */}
          <div className="flex gap-1.5">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className="h-1 flex-1 rounded-full overflow-hidden bg-muted transition-colors duration-500"
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    step.id < currentStep
                      ? "w-full bg-primary"
                      : step.id === currentStep
                      ? "bg-primary"
                      : "w-0 bg-primary"
                  }`}
                  style={{
                    width:
                      step.id < currentStep
                        ? "100%"
                        : step.id === currentStep
                        ? `${((currentStep - 1) / 1) * 100}%`
                        : "0%",
                    // For current step, fill based on sub-progress — just show full for simplicity
                    ...(step.id === currentStep ? { width: "100%" } : {}),
                  }}
                />
              </div>
            ))}
          </div>
        </CardHeader>

        {/* Content with transition */}
        <CardContent
          ref={contentRef}
          className="overflow-y-auto px-6 pb-2"
          style={{ maxHeight: "calc(92vh - 200px)" }}
        >
          <div
            className={`transition-all duration-200 ease-out ${
              isTransitioning
                ? direction === "forward"
                  ? "opacity-0 translate-x-4"
                  : "opacity-0 -translate-x-4"
                : "opacity-100 translate-x-0"
            }`}
          >
            {renderStep()}
          </div>
        </CardContent>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="gap-1.5 bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 font-medium active:scale-[0.97] transition-all duration-150"
          >
            {currentStep === STEPS.length ? (
              <>
                Create account
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
