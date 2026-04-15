import { Button } from "@/components/ui/button";
import { Smile, Shield, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-72 w-72 rounded-full bg-sage-light/40 blur-3xl animate-breathe" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-terracotta-light/30 blur-3xl animate-breathe" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground animate-fade-in-up">
          <Sparkles className="h-4 w-4" />
          A calmer way to interview
        </div>

        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          Interviews shouldn't<br />
          feel <span className="text-primary">stressful</span>
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          We believe everyone deserves to show their best self. SereneHire creates a comfortable, 
          supportive environment so you can focus on what matters — being you.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <Button variant="hero" size="xl" onClick={() => document.getElementById("schedule")?.scrollIntoView({ behavior: "smooth" })}>
            Schedule Your Interview
          </Button>
          <Button variant="warmOutline" size="lg" onClick={() => document.getElementById("join")?.scrollIntoView({ behavior: "smooth" })}>
            Already Scheduled? Join Here
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          {[
            { icon: Smile, title: "Calm Environment", desc: "Designed to reduce interview anxiety" },
            { icon: Shield, title: "Accessible", desc: "Accommodations built right in" },
            { icon: Sparkles, title: "Fair Process", desc: "Everyone gets the same experience" },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-2 rounded-2xl bg-card/80 p-6 shadow-sm">
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
