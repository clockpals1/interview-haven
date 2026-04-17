import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Video, LogOut, Calendar, Clock, User, Mail, Accessibility,
  Loader2, Trash2, Search, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — SereneHire" },
      { name: "description", content: "Manage scheduled interviews" },
    ],
  }),
  component: AdminDashboard,
});

interface Interview {
  id: string;
  candidate_name: string;
  candidate_email: string;
  interview_date: string;
  interview_time: string;
  accessibility_needs: string | null;
  confirmation_code: string;
  status: string;
  created_at: string;
}

function AdminDashboard() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchInterviews();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate({ to: "/admin/login" });
      return;
    }
    setAdminEmail(user.email || "");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      await supabase.auth.signOut();
      navigate({ to: "/admin/login" });
    }
  };

  const fetchInterviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scheduled_interviews")
      .select("*")
      .order("interview_date", { ascending: true });

    if (!error && data) {
      setInterviews(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this interview?")) return;
    const { error } = await supabase.from("scheduled_interviews").delete().eq("id", id);
    if (!error) {
      setInterviews((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  const filtered = interviews.filter(
    (i) =>
      i.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
      i.candidate_email.toLowerCase().includes(search.toLowerCase()) ||
      i.confirmation_code.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s: string) => {
    if (s === "scheduled") return "bg-secondary text-secondary-foreground";
    if (s === "completed") return "bg-primary/10 text-primary";
    if (s === "cancelled") return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
              <Video className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="truncate font-bold text-foreground">
              SereneHire <span className="hidden text-sm font-normal text-muted-foreground sm:inline">Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground sm:inline">{adminEmail}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-3 sm:gap-4">
          {[
            { label: "Total Interviews", value: interviews.length, icon: Calendar },
            { label: "Upcoming", value: interviews.filter((i) => i.status === "scheduled").length, icon: Clock },
            { label: "With Accessibility Needs", value: interviews.filter((i) => i.accessibility_needs).length, icon: Accessibility },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-card p-4 shadow-sm border border-border/50 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-foreground sm:text-2xl">{stat.value}</p>
                  <p className="truncate text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="mb-6 flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, email, or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl h-10 pl-10" />
          </div>
          <Button variant="outline" size="icon" onClick={fetchInterviews} className="rounded-xl h-10 w-10 shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center border border-border/50 sm:p-12">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium text-foreground">No interviews found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? "Try a different search term" : "Interviews will appear here once candidates schedule them"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((interview) => (
              <div key={interview.id} className="rounded-2xl bg-card p-4 shadow-sm border border-border/50 transition-all hover:shadow-md sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-semibold text-foreground">{interview.candidate_name}</span>
                      </div>
                      <Badge className={statusColor(interview.status)}>{interview.status}</Badge>
                      <span className="font-mono text-xs text-muted-foreground">{interview.confirmation_code}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:text-sm">
                      <span className="flex min-w-0 items-center gap-1"><Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{interview.candidate_email}</span></span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(new Date(interview.interview_date), "MMM d, yyyy")}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {interview.interview_time}</span>
                    </div>
                    {interview.accessibility_needs && (
                      <div className="flex items-start gap-1.5 text-sm">
                        <Accessibility className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{interview.accessibility_needs}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="accent" size="sm" className="flex-1 sm:flex-none" onClick={() => navigate({ to: "/interview", search: { code: interview.confirmation_code } })}>
                      Join
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => handleDelete(interview.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
