import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Accessibility, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM",
];

export function ScheduleSection() {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accessibility, setAccessibility] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !name || !email) return;

    setLoading(true);
    setError("");

    const code = `SH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { error: dbError } = await supabase.from("scheduled_interviews").insert({
      candidate_name: name.trim(),
      candidate_email: email.trim(),
      interview_date: format(date, "yyyy-MM-dd"),
      interview_time: time,
      accessibility_needs: accessibility.trim() || null,
      confirmation_code: code,
    });

    setLoading(false);

    if (dbError) {
      setError("Something went wrong. Please try again.");
      console.error(dbError);
      return;
    }

    setConfirmCode(code);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section id="schedule" className="px-6 py-20">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-secondary animate-pulse-soft">
            <Send className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-foreground">You're All Set!</h2>
          <p className="mb-6 text-muted-foreground">
            Your interview has been scheduled for{" "}
            <span className="font-semibold text-foreground">{date && format(date, "MMMM d, yyyy")}</span> at{" "}
            <span className="font-semibold text-foreground">{time}</span>.
          </p>
          <div className="rounded-2xl bg-card p-6 shadow-md border border-border">
            <p className="text-sm text-muted-foreground mb-2">Your confirmation code</p>
            <p className="text-3xl font-mono font-bold tracking-widest text-primary">{confirmCode}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Save this code — you'll need it to join your interview.
            </p>
          </div>
          <Button variant="warmOutline" size="lg" className="mt-6" onClick={() => { setSubmitted(false); setDate(undefined); setTime(""); setName(""); setEmail(""); setAccessibility(""); }}>
            Schedule Another
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section id="schedule" className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">Schedule Your Interview</h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Choose a time that works for you. Take a deep breath — we've got you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl bg-card p-5 shadow-lg border border-border/50 sm:p-8">
          {error && (
            <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive text-center">{error}</div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl h-11" maxLength={100} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl h-11" maxLength={255} />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Interview Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl h-11", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Preferred Time</label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="rounded-xl h-11">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select time" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Accessibility className="h-4 w-4 text-primary" />
              Accessibility Needs (Optional)
            </label>
            <Textarea
              placeholder="Let us know if you need any accommodations — screen reader support, extended time, sign language interpreter, etc."
              value={accessibility}
              onChange={(e) => setAccessibility(e.target.value)}
              className="rounded-xl min-h-[80px]"
              maxLength={1000}
            />
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "Scheduling..." : "Confirm My Interview"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            You'll receive a confirmation code and email with all the details.
          </p>
        </form>
      </div>
    </section>
  );
}
