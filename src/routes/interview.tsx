import { createFileRoute } from "@tanstack/react-router";
import { InterviewRoom } from "@/components/InterviewRoom";

type InterviewRole = "interviewer" | "candidate";

type InterviewSearch = {
  code?: string;
  role?: InterviewRole;
};

export const Route = createFileRoute("/interview")({
  validateSearch: (search: Record<string, unknown>): InterviewSearch => ({
    code: typeof search.code === "string" ? search.code : undefined,
    role: search.role === "interviewer" || search.role === "candidate" ? search.role : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Interview Room — SereneHire" },
      { name: "description", content: "Your interview room — relax, be yourself." },
    ],
  }),
  component: InterviewPage,
});

function InterviewPage() {
  const { code, role } = Route.useSearch();
  return <InterviewRoom code={code} role={role} />;
}
