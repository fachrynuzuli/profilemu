import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Users, Heart, Star } from "lucide-react";

const useCases = [
  {
    icon: Briefcase,
    title: "Talent Discovery",
    subtitle: "For Professionals",
    description: "Hiring managers can chat with your AI to understand your skills, experience, and culture fit — even while you sleep.",
    gradient: "from-primary/20 to-transparent",
  },
  {
    icon: Users,
    title: "Freelancer AI",
    subtitle: "For Creators",
    description: "Potential clients can explore your portfolio, ask about your process, and book you — all through your AI twin.",
    gradient: "from-accent/20 to-transparent",
  },
  {
    icon: Heart,
    title: "Dating Profile 2.0",
    subtitle: "For Connections",
    description: "Let matches chat with your AI to truly get to know you before meeting. Deeper connections, less small talk.",
    gradient: "from-pink-500/20 to-transparent",
  },
  {
    icon: Star,
    title: "Fan Service",
    subtitle: "For Creators & Artists",
    description: "Fans can have personal conversations with your AI. Scale intimacy without burning out.",
    gradient: "from-secondary/30 to-transparent",
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            Endless <span className="text-gradient">Possibilities</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your AI twin opens doors you never knew existed. Here's how people are using Profile.Mu.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {useCases.map((useCase, index) => (
            <Card 
              key={index} 
              variant="glass"
              className="group overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <CardContent className="p-8 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center shadow-soft shrink-0">
                    <useCase.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  
                  <div>
                    <div className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                      {useCase.subtitle}
                    </div>
                    <h3 className="font-display text-2xl mb-3">{useCase.title}</h3>
                    <p className="text-muted-foreground">{useCase.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
