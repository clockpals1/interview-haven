import { MessageSquare, Video, Mic, Eye, Volume2, Palette } from "lucide-react";

const features = [
  { icon: Video, title: "HD Video", desc: "Crystal-clear video with ambient background options to feel at ease" },
  { icon: Mic, title: "Voice Chat", desc: "High-quality audio with noise suppression and gentle volume controls" },
  { icon: MessageSquare, title: "Live Chat", desc: "Type when speaking feels hard — no judgment, your comfort matters" },
  { icon: Eye, title: "Focus Mode", desc: "Minimize distractions by simplifying the UI with one click" },
  { icon: Volume2, title: "Ambient Sounds", desc: "Optional calming background sounds to ease the nerves" },
  { icon: Palette, title: "Custom Themes", desc: "Choose a visual theme that feels comfortable to you" },
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground">Built for Comfort</h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            Every feature is designed to help you feel confident and present during your interview.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl bg-card p-6 shadow-sm border border-border/50 transition-all duration-300 hover:shadow-md hover:border-primary/20">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary transition-colors group-hover:bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1.5 font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
