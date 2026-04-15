import { Link } from "@tanstack/react-router";
import { Video } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md">
            <Video className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Serene<span className="text-primary">Hire</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <a href="#schedule" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Schedule
          </a>
          <a href="#join" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Join Interview
          </a>
          <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <Link to="/admin/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
