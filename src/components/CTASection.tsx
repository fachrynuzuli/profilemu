import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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

  return (
    <>
      <section className="py-32 border-t border-border" ref={ref}>
        <div className="container mx-auto px-4">
          <div
            className={`max-w-2xl mx-auto text-center transition-all duration-700 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="font-display text-4xl md:text-6xl tracking-tight mb-6">
              Your turn.
            </h2>

            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Create an AI that knows what you know and talks the way you talk. 
              Takes 5 minutes to set up, works forever.
            </p>

            <Button
              size="xl"
              onClick={() => setShowWizard(true)}
              className="min-h-[48px] bg-foreground text-background hover:bg-foreground/90 rounded-full font-semibold px-10"
            >
              Create your Profile.Mu
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="text-sm text-muted-foreground mt-6">
              Free forever for one profile · No credit card needed
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
