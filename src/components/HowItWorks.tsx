import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Brain, Globe, MessageCircle } from "lucide-react";

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
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            How <span className="text-gradient">Profile.Mu</span> Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to create your AI extension that represents you everywhere.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <Card 
              key={index} 
              variant="elevated"
              className="group cursor-pointer"
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
    </section>
  );
}
