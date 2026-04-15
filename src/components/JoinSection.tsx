import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, ArrowRight } from "lucide-react";

export function JoinSection() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) return;
    navigate({ to: "/interview", search: { code } });
  };

  return (
    <section id="join" className="px-6 py-20">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta-light/50">
            <KeyRound className="h-6 w-6 text-accent" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">Already Scheduled?</h2>
          <p className="text-muted-foreground">Enter your email and confirmation code to join.</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4 rounded-2xl bg-card p-6 shadow-md border border-border/50">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email Address</label>
            <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl h-11" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Confirmation Code</label>
            <Input placeholder="SH-XXXXXX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required className="rounded-xl h-11 font-mono tracking-wider" />
          </div>
          <Button type="submit" variant="accent" size="lg" className="w-full">
            Join Interview <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </form>
      </div>
    </section>
  );
}
