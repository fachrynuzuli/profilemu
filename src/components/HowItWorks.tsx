import { useInView } from "@/hooks/useInView";

const steps = [
  {
    number: "01",
    title: "Add your context",
    description:
      "Upload a resume, paste your bio, or connect your LinkedIn. The more you share, the more accurate your twin becomes.",
  },
  {
    number: "02",
    title: "AI learns your voice",
    description:
      "We analyze your writing style, expertise areas, and personality. Your twin speaks like you — not like a generic chatbot.",
  },
  {
    number: "03",
    title: "Publish your profile",
    description:
      "Get a shareable link (profilemu.app/you) or embed the chat widget on your own site. One click to go live.",
  },
  {
    number: "04",
    title: "People chat with you",
    description:
      "Recruiters, clients, fans — anyone can have a real conversation with your AI. You stay informed, they get answers.",
  },
];

export function HowItWorks() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="how-it-works" className="py-24 border-t border-border">
      <div className="container mx-auto px-4" ref={ref}>
        <div
          className={`mb-16 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">How it works</p>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight max-w-lg">
            From zero to your AI twin in four steps.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-x-16 gap-y-12 max-w-4xl">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`transition-all duration-700 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: isInView ? `${index * 100 + 200}ms` : "0ms" }}
            >
              <span className="text-4xl font-display font-bold text-border select-none">
                {step.number}
              </span>
              <h3 className="font-display text-xl mt-2 mb-2">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
