import { LiveDemoChat } from "./LiveDemoChat";
import { useInView } from "@/hooks/useInView";

export function DemoSection() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="demo" className="py-24 border-t border-border">
      <div className="container mx-auto px-4" ref={ref}>
        <div className="grid lg:grid-cols-[1fr,minmax(0,480px)] gap-12 lg:gap-16 items-start max-w-5xl mx-auto">
          {/* Left: context */}
          <div
            className={`lg:sticky lg:top-32 transition-all duration-700 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">Live demo</p>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-4">
              Chat with Fachry's AI twin right now.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              This is a real AI twin — trained on Fachry's background in product management, 
              startups, and digital transformation. Ask anything you'd ask him in person.
            </p>
            <p className="text-sm text-muted-foreground">
              Notice how it feels like texting a real person, not talking to a bot.
            </p>
          </div>

          {/* Right: chat */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            <LiveDemoChat />
          </div>
        </div>
      </div>
    </section>
  );
}
