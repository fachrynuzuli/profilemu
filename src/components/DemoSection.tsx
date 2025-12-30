import { LiveDemoChat } from "./LiveDemoChat";

export function DemoSection() {
  return (
    <section id="demo" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            See Your <span className="text-gradient">AI Twin</span> In Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Chat with Fachry, the CEO of Profile.Mu. This is a real AI twin powered by his actual knowledge and personality.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <LiveDemoChat />

          <p className="text-center text-sm text-muted-foreground mt-4">
            This is Fachry's real AI twin. Create yours to enable 24/7 conversations in your voice.
          </p>
        </div>
      </div>
    </section>
  );
}
