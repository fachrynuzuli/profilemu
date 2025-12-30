import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Briefcase, 
  Target, 
  MessageSquare, 
  ArrowRight, 
  ArrowLeft,
  Check,
  Sparkles
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
  { id: 1, title: "Basic Info", icon: User, description: "Let's start with who you are" },
  { id: 2, title: "Background", icon: Briefcase, description: "Your professional story" },
  { id: 3, title: "Expertise", icon: Target, description: "What you know best (and don't)" },
  { id: 4, title: "Voice & Style", icon: MessageSquare, description: "How you communicate" },
];

export function OnboardingWizard({ onComplete, onClose }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
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

  const progress = (currentStep / STEPS.length) * 100;

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
      // Auto-generate slug when name changes
      if (field === "displayName" && !prev.slug) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save to localStorage before auth
      localStorage.setItem("onboarding_data", JSON.stringify(data));
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return data.displayName.trim().length >= 2;
    }
    return true; // Other steps are optional
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Your Name *</Label>
              <Input
                id="displayName"
                placeholder="e.g., Fachry Zahirah"
                value={data.displayName}
                onChange={(e) => handleInputChange("displayName", e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Short Bio / Tagline</Label>
              <Textarea
                id="bio"
                placeholder="e.g., Product leader & startup founder passionate about education technology"
                value={data.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This appears as your headline on your public profile
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Profile URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">profilemu.dev/p/</span>
                <Input
                  id="slug"
                  placeholder="your-name"
                  value={data.slug}
                  onChange={(e) => handleInputChange("slug", generateSlug(e.target.value))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="background">Professional Background</Label>
              <Textarea
                id="background"
                placeholder="Tell us about your career journey, key roles, and accomplishments..."
                value={data.background}
                onChange={(e) => handleInputChange("background", e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Your AI will use this to answer questions about your experience
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Key Skills & Technologies</Label>
              <Textarea
                id="skills"
                placeholder="e.g., Product Management, React, Python, Data Analysis, UX Design..."
                value={data.skills}
                onChange={(e) => handleInputChange("skills", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="expertiseAreas">What are you an expert in?</Label>
              <Textarea
                id="expertiseAreas"
                placeholder="e.g., Building SaaS products, Digital transformation in education, Go-to-market strategy..."
                value={data.expertiseAreas}
                onChange={(e) => handleInputChange("expertiseAreas", e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Your AI will confidently answer questions about these topics
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expertiseBoundaries">What's outside your expertise?</Label>
              <Textarea
                id="expertiseBoundaries"
                placeholder="e.g., Legal advice, Medical recommendations, Deep technical backend architecture..."
                value={data.expertiseBoundaries}
                onChange={(e) => handleInputChange("expertiseBoundaries", e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Your AI will politely defer questions on these topics
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="voiceSamples">Writing Samples (Optional)</Label>
              <Textarea
                id="voiceSamples"
                placeholder="Paste a few examples of how you write - emails, tweets, or messages that capture your voice..."
                value={data.voiceSamples}
                onChange={(e) => handleInputChange("voiceSamples", e.target.value)}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="communicationStyle">Communication Style</Label>
              <Textarea
                id="communicationStyle"
                placeholder="e.g., Friendly but professional, uses humor, keeps things concise, often uses analogies..."
                value={data.communicationStyle}
                onChange={(e) => handleInputChange("communicationStyle", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card variant="glass" className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="space-y-4">
          {/* Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Create Your AI Twin</CardTitle>
                <CardDescription>Step {currentStep} of {STEPS.length}</CardDescription>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>

          <Progress value={progress} className="h-2" />

          {/* Step indicators */}
          <div className="flex justify-between">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-1 ${
                    isActive ? "text-primary" : isCompleted ? "text-muted-foreground" : "text-muted-foreground/50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-primary/20 text-primary"
                        : "bg-muted"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-xs hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 overflow-y-auto max-h-[50vh]">
          {/* Step title */}
          <div className="text-center pb-2">
            <h3 className="font-display text-lg">{STEPS[currentStep - 1].title}</h3>
            <p className="text-sm text-muted-foreground">
              {STEPS[currentStep - 1].description}
            </p>
          </div>

          {/* Step content */}
          {renderStep()}
        </CardContent>

        {/* Footer */}
        <div className="p-6 border-t border-border/50 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            variant="hero"
            onClick={handleNext}
            disabled={!canProceed()}
            className="gap-2"
          >
            {currentStep === STEPS.length ? (
              <>
                Create Account
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
