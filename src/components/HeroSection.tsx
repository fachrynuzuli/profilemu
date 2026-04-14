import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { OnboardingWizard } from "./OnboardingWizard";
import { useNavigate } from "react-router-dom";
import { useInView } from "@/hooks/useInView";

export function HeroSection() {
  const [showWizard, setShowWizard] = useState(false);
  const navigate = useNavigate();
  const { ref, isInView } = useInView({ threshold: 0.1 });

  const handleOnboardingComplete = (data: any) => {
    setShowWizard(false);
    navigate("/auth?signup=true");
  };

  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <section className="relative pt-32 pb-24 overflow-hidden" ref={ref}>
        <div className="container mx-auto px-4 relative z-10">
          {/* Left-aligned hero — breaks the centered AI template */}
          <div className="max-w-3xl">
            <h1
              className={`font-display text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.05] tracking-tight mb-6 transition-all duration-700 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              An AI that talks
              <br />
              <span className="text-primary">like you do.</span>
            </h1>

            <p
              className={`text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed transition-all duration-700 delay-100 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Profile.Mu creates a digital version of you — trained on your knowledge, 
              speaking in your voice. People can chat with it anytime, like texting you directly.
            </p>

            <div
              className={`flex flex-wrap items-center gap-4 transition-all duration-700 delay-200 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <Button
                size="xl"
                onClick={() => setShowWizard(true)}
                className="min-h-[48px] bg-foreground text-background hover:bg-foreground/90 rounded-full font-semibold px-8"
              >
                Create yours free
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="xl"
                onClick={scrollToDemo}
                className="min-h-[48px] text-muted-foreground hover:text-foreground"
              >
                Try a live demo ↓
              </Button>
            </div>

            <p
              className={`text-sm text-muted-foreground mt-8 transition-all duration-700 delay-300 ${
                isInView ? "opacity-100" : "opacity-0"
              }`}
            >
              5 minute setup · No credit card · Free forever for one profile
            </p>
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
