import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Brain, Globe, MessageCircle } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const steps = [
  {
    icon: UserPlus,
    title: "Share Your Context",
    description: "Upload your knowledge, writing style, career history, and what makes you unique.",
    color: "from-primary to-primary/60",
  },
  {
    icon: Brain,
    title: "AI Learns You",
    description: "Our AI summarizes, understands, and becomes your digital twin with your personality.",
    color: "from-accent to-accent/60",
  },
  {
    icon: Globe,
    title: "Publish Your Profile",
    description: "Go live with one click. Like publishing a blog, but it's an AI that speaks for you.",
    color: "from-secondary to-secondary/60",
  },
  {
    icon: MessageCircle,
    title: "Anyone Can Chat",
    description: "Recruiters, fans, clients — anyone can have meaningful conversations with your AI 24/7.",
    color: "from-primary to-accent",
  },
];

export function HowItWorks() {
  const { ref: headerRef, isInView: headerVisible } = useInView();
  const { ref: gridRef, isInView: gridVisible } = useInView({ threshold: 0.1 });

  return (
    <section id="how-it-works" className="py-24 relative bg-muted/20">
      {/* Decorative top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            How <span className="text-gradient">Profile.Mu</span> Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to create your AI extension that represents you everywhere.
          </p>
        </div>

        <div ref={gridRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <Card 
              key={index} 
              variant="elevated"
              className={`group cursor-pointer transition-all duration-700 ${
                gridVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: gridVisible ? `${index * 120}ms` : "0ms" }}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-soft group-hover:shadow-glow transition-all duration-300`}>
                  <step.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                
                <div className="text-sm font-medium text-primary mb-2">Step {index + 1}</div>
                <h3 className="font-display text-xl mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Decorative bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}
