import { LiveDemoChat } from "./LiveDemoChat";
import { useInView } from "@/hooks/useInView";

export function DemoSection() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="demo" className="py-24 relative overflow-hidden bg-muted/30">
      {/* Decorative top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Spotlight glow behind the chat */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] gradient-glow opacity-50 blur-2xl pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            See Your <span className="text-gradient">AI Twin</span> In Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Chat with Fachry, the CEO of Profile.Mu. This is a real AI twin powered by his actual knowledge and personality.
          </p>
        </div>

        {/* Device frame */}
        <div
          className={`max-w-2xl mx-auto transition-all duration-1000 delay-200 ${
            isInView ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"
          }`}
        >
          {/* Browser chrome */}
          <div className="bg-card border border-border rounded-t-2xl px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-accent/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-muted rounded-lg px-3 py-1 text-xs text-muted-foreground text-center font-body">
                profilemu.lovable.app/fachry
              </div>
            </div>
          </div>

          {/* Chat content */}
          <div className="border border-t-0 border-border rounded-b-2xl overflow-hidden shadow-card">
            <LiveDemoChat />
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            This is Fachry's real AI twin. Create yours to enable 24/7 conversations in your voice.
          </p>
        </div>
      </div>

      {/* Decorative bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}
