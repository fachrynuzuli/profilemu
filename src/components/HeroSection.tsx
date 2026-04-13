import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroAvatar from "@/assets/hero-avatar.png";
import { OnboardingWizard } from "./OnboardingWizard";
import { useNavigate } from "react-router-dom";
import { useInView } from "@/hooks/useInView";

export function HeroSection() {
  const [showWizard, setShowWizard] = useState(false);
  const navigate = useNavigate();
  const { ref: heroRef, isInView: heroVisible } = useInView({ threshold: 0.1 });
  const { ref: imageRef, isInView: imageVisible } = useInView({ threshold: 0.2 });

  const handleOnboardingComplete = (data: any) => {
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
        {/* Dot grid background */}
        <div className="absolute inset-0 dot-grid opacity-40" />
        
        {/* Gradient mesh overlay */}
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        
        {/* Animated glow orb */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] gradient-glow animate-pulse-glow opacity-30" />

        <div className="container mx-auto px-4 relative z-10" ref={heroRef}>
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 transition-all duration-700 ${
                heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Your Digital Twin, Always Available</span>
            </div>

            {/* Headline */}
            <h1
              className={`font-display text-5xl md:text-7xl lg:text-8xl leading-tight mb-6 transition-all duration-700 delay-100 ${
                heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <span className="text-gradient">Profile.</span>
              <span className="text-foreground">Mu</span>
            </h1>

            <p
              className={`text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 transition-all duration-700 delay-200 ${
                heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Create an AI that speaks in your voice, shares your knowledge, and represents you 24/7. 
              <span className="text-foreground font-medium"> The future of personal branding.</span>
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${
                heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <Button variant="hero" size="xl" onClick={() => setShowWizard(true)} className="min-h-[48px]">
                Create Your AI Twin
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="glass" size="xl" onClick={scrollToDemo} className="min-h-[48px]">
                See It In Action
              </Button>
            </div>

            {/* Social proof — single honest line instead of fake stats */}
            <p
              className={`text-sm text-muted-foreground mt-12 transition-all duration-700 delay-500 ${
                heroVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              Free to start · Set up in under 5 minutes · No credit card required
            </p>
          </div>

          {/* Hero Image */}
          <div
            ref={imageRef}
            className={`mt-16 max-w-5xl mx-auto relative transition-all duration-1000 delay-300 ${
              imageVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
            }`}
          >
            <div className="absolute inset-0 gradient-glow opacity-50 blur-3xl" />
            <img 
              src={heroAvatar} 
              alt="AI Digital Twin Visualization" 
              className="relative w-full h-auto rounded-3xl shadow-glow"
            />
          </div>
        </div>
      </section>

      {showWizard && (
        <OnboardingWizard 
          onComplete={handleOnboardingComplete}
          onClose={() => setShowWizard(false)}
        />
      )}
    </>
  );
}
