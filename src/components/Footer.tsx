export function Footer() {
  return (
    <footer className="py-8 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-sm font-semibold">Profile.Mu</span>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Profile.Mu
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center">
              Privacy
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
