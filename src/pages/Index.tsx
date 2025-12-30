import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorks } from "@/components/HowItWorks";
import { UseCases } from "@/components/UseCases";
import { DemoSection } from "@/components/DemoSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

const Index = () => {
  const location = useLocation();

  // Scroll to top on mount, unless there's a hash in the URL
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <UseCases />
        <DemoSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
