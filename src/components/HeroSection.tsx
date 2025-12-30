import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroAvatar from "@/assets/hero-avatar.png";
import { OnboardingWizard } from "./OnboardingWizard";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const [showWizard, setShowWizard] = useState(false);
  const navigate = useNavigate();

  const handleOnboardingComplete = (data: any) => {
    // Data is already saved to localStorage by the wizard
    setShowWizard(false);
    navigate("/auth?signup=true");
  };

  const scrollToDemo = () => {
    const demoSection = document.getElementById("demo");
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <section className="relative min-h-screen pt-32 pb-20 overflow-hidden">
        {/* Background mesh gradient */}
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        
        {/* Animated glow orb */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] gradient-glow animate-pulse-glow opacity-40" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Your Digital Twin, Always Available</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-tight mb-6 animate-slide-up">
              <span className="text-gradient">Profile.</span>
              <span className="text-foreground">Mu</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Create an AI that speaks in your voice, shares your knowledge, and represents you 24/7. 
              <span className="text-foreground font-medium"> The future of personal branding.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button variant="hero" size="xl" onClick={() => setShowWizard(true)}>
                Create Your AI Twin
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="glass" size="xl" onClick={scrollToDemo}>
                See It In Action
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="text-center">
                <div className="text-3xl font-display text-foreground">24/7</div>
                <div className="text-sm text-muted-foreground">Always Available</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-3xl font-display text-foreground">∞</div>
                <div className="text-sm text-muted-foreground">Conversations</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-3xl font-display text-foreground">100%</div>
                <div className="text-sm text-muted-foreground">Your Voice</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-16 max-w-5xl mx-auto relative animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <div className="absolute inset-0 gradient-glow opacity-50 blur-3xl" />
            <img 
              src={heroAvatar} 
              alt="AI Digital Twin Visualization" 
              className="relative w-full h-auto rounded-3xl shadow-glow animate-float"
            />
          </div>
        </div>
      </section>

      {/* Onboarding Wizard Modal */}
      {showWizard && (
        <OnboardingWizard 
          onComplete={handleOnboardingComplete}
          onClose={() => setShowWizard(false)}
        />
      )}
    </>
  );
}
