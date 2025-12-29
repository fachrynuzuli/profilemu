import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-10" />
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Start Free Today</span>
          </div>

          <h2 className="font-display text-4xl md:text-6xl mb-6">
            Ready to Create Your{" "}
            <span className="text-gradient">Digital Twin?</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-10">
            Join the future of personal branding. Your AI extension is just a few clicks away.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl">
              Create Your Profile.Mu
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="xl">
              Watch Demo
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            No credit card required • Free tier available • Set up in 5 minutes
          </p>
        </div>
      </div>
    </section>
  );
}
