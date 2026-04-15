import { createFileRoute } from "@tanstack/react-router";
import { InterviewRoom } from "@/components/InterviewRoom";

type InterviewSearch = {
  code?: string;
};

export const Route = createFileRoute("/interview")({
  validateSearch: (search: Record<string, unknown>): InterviewSearch => ({
    code: typeof search.code === "string" ? search.code : undefined,
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
  const { code } = Route.useSearch();
  return <InterviewRoom code={code} />;
}
