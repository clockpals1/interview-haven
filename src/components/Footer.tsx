import { Video, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Video className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">SereneHire</span>
        </div>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          Made with <Heart className="h-3.5 w-3.5 text-accent fill-accent" /> for calmer interviews
        </p>
      </div>
    </footer>
  );
}
