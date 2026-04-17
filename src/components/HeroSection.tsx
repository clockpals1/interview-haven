import { Button } from "@/components/ui/button";
import { Smile, Shield, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 md:py-32">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-56 w-56 rounded-full bg-sage-light/40 blur-3xl animate-breathe sm:h-72 sm:w-72" />
        <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-terracotta-light/30 blur-3xl animate-breathe sm:h-64 sm:w-64" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-secondary-foreground animate-fade-in-up sm:text-sm">
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          A calmer way to interview
        </div>

        <h1 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-6xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          Interviews shouldn't<br />
          feel <span className="text-primary">stressful</span>
        </h1>

        <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:mb-10 sm:text-lg animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          We believe everyone deserves to show their best self. SereneHire creates a comfortable,
          supportive environment so you can focus on what matters — being you.
        </p>

        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <Button variant="hero" size="xl" onClick={() => document.getElementById("schedule")?.scrollIntoView({ behavior: "smooth" })}>
            Schedule Your Interview
          </Button>
          <Button variant="warmOutline" size="lg" onClick={() => document.getElementById("join")?.scrollIntoView({ behavior: "smooth" })}>
            Already Scheduled? Join Here
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-3 sm:gap-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          {[
            { icon: Smile, title: "Calm Environment", desc: "Designed to reduce interview anxiety" },
            { icon: Shield, title: "Accessible", desc: "Accommodations built right in" },
            { icon: Sparkles, title: "Fair Process", desc: "Everyone gets the same experience" },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-2 rounded-2xl bg-card/80 p-5 shadow-sm border border-border/40 sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
