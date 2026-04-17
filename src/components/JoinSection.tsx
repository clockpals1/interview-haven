import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function JoinSection() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) return;

    setLoading(true);
    setError("");

    const { data, error: dbError } = await supabase
      .from("scheduled_interviews")
      .select("id, confirmation_code")
      .eq("confirmation_code", code.trim())
      .eq("candidate_email", email.trim())
      .maybeSingle();

    setLoading(false);

    if (dbError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    if (!data) {
      setError("No interview found with that email and code. Please check and try again.");
      return;
    }

    navigate({ to: "/lobby", search: { code: data.confirmation_code } });
  };

  return (
    <section id="join" className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta-light/50">
            <KeyRound className="h-6 w-6 text-accent" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">Already Scheduled?</h2>
          <p className="text-sm text-muted-foreground sm:text-base">Enter your email and confirmation code to join.</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4 rounded-2xl bg-card p-5 shadow-md border border-border/50 sm:p-6">
          {error && (
            <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive text-center">{error}</div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email Address</label>
            <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl h-11" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Confirmation Code</label>
            <Input placeholder="SH-XXXXXX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required className="rounded-xl h-11 font-mono tracking-wider" />
          </div>
          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Join Interview <ArrowRight className="ml-1 h-4 w-4" /></>}
          </Button>
        </form>
      </div>
    </section>
  );
}
