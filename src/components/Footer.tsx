import { MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 border-t border-border bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center shadow-soft">
              <MessageCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl">Profile.Mu</span>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Profile.Mu — Your Profile, Powered by AI
          </p>

          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              Terms
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
