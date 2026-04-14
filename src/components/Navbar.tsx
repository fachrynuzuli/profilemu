import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => navigate("/")}
        >
          <span className="font-display text-xl font-bold tracking-tight">Profile.Mu</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Use Cases
          </a>
          <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Demo
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {!loading && (
            user ? (
              <Button
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium"
              >
                Dashboard
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate("/auth")}
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium"
              >
                Sign in
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
