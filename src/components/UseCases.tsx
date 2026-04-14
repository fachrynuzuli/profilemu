import { useInView } from "@/hooks/useInView";

const useCases = [
  {
    emoji: "💼",
    title: "Job seekers",
    description:
      "Hiring managers explore your skills and experience in a conversation — even at 2am their time.",
  },
  {
    emoji: "🎨",
    title: "Freelancers",
    description:
      "Potential clients learn about your process, see your work, and get pricing — without back-and-forth emails.",
  },
  {
    emoji: "🎤",
    title: "Creators & artists",
    description:
      "Give fans a way to ask you anything. Scale personal connection without burning out.",
  },
  {
    emoji: "🤝",
    title: "Founders & leaders",
    description:
      "Investors, partners, and press get to know your vision on their own time.",
  },
];

export function UseCases() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="use-cases" className="py-24 bg-muted/40 border-t border-border">
      <div className="container mx-auto px-4" ref={ref}>
        <div
          className={`mb-16 max-w-lg transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">Use cases</p>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight">
            Built for people who get asked the same questions.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl">
          {useCases.map((item, index) => (
            <div
              key={index}
              className={`p-6 rounded-2xl bg-background border border-border transition-all duration-700 hover:shadow-md-token ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: isInView ? `${index * 80 + 200}ms` : "0ms" }}
            >
              <span className="text-2xl mb-3 block">{item.emoji}</span>
              <h3 className="font-display text-lg mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
