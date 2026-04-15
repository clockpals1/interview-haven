import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ScheduleSection } from "@/components/ScheduleSection";
import { JoinSection } from "@/components/JoinSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SereneHire — Calmer Interviews, Better Hires" },
      { name: "description", content: "Schedule and join interviews in a calm, supportive environment. Video, voice, and chat — designed to help candidates show their best self." },
      { property: "og:title", content: "SereneHire — Calmer Interviews, Better Hires" },
      { property: "og:description", content: "Schedule and join interviews in a calm, supportive environment." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <ScheduleSection />
      <div className="mx-auto max-w-4xl px-6">
        <hr className="border-border/50" />
      </div>
      <JoinSection />
      <div className="mx-auto max-w-4xl px-6">
        <hr className="border-border/50" />
      </div>
      <FeaturesSection />
      <Footer />
    </div>
  );
}
