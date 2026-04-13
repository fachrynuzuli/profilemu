import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { OnboardingWizard } from "./OnboardingWizard";
import { useNavigate } from "react-router-dom";

export function CTASection() {
  const { ref, isInView } = useInView();
  const [showWizard, setShowWizard] = useState(false);
  const navigate = useNavigate();

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
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        
        <div className="container mx-auto px-4 relative z-10" ref={ref}>
          <div
            className={`max-w-3xl mx-auto text-center transition-all duration-700 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Start Free Today</span>
            </div>

            <h2 className="font-display text-4xl md:text-6xl mb-6">
              Ready to Create Your{" "}
              <span className="text-gradient">Digital Twin?</span>
            </h2>

            <p className="text-xl text-muted-foreground mb-10">
              Your AI extension is just a few clicks away. Join thousands building their digital presence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" onClick={() => setShowWizard(true)} className="min-h-[48px]">
                Create Your Profile.Mu
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="glass" size="xl" onClick={scrollToDemo} className="min-h-[48px]">
                See Demo
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-8">
              No credit card required · Free tier available · Set up in 5 minutes
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
