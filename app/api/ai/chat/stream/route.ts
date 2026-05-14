import { NextRequest } from "next/server";
import { z } from "zod";
import { getRequiredSession } from "@/lib/session";
import { orchestrateStream, type AgentType } from "@/lib/ai/orchestrator";
import { parseUploadedFile, buildFileContext } from "@/lib/ai/file-parser";

const VALID_AGENTS: AgentType[] = [
  "SpendingAnalysisAgent", "BudgetPlannerAgent", "GoalPlannerAgent",
  "DebtRiskAgent", "SubscriptionWasteAgent", "FinancialHealthAgent",
  "ActionPlanAgent", "ReportAgent", "ExplanationAgent",
];

const jsonSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
  forceAgent: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  let message = "";
  let conversationId: string | undefined;
  let forceAgent: string | undefined;
  let fileContext = "";

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    message = (formData.get("message") as string | null) ?? "";
    conversationId = (formData.get("conversationId") as string | null) ?? undefined;
    forceAgent = (formData.get("forceAgent") as string | null) ?? undefined;

    if (!message.trim()) return new Response("Bad Request", { status: 400 });

    const files = formData.getAll("files") as File[];
    const parsed = await Promise.all(files.map(parseUploadedFile));
    const valid = parsed.filter((f): f is NonNullable<typeof f> => f !== null);
    fileContext = buildFileContext(valid);
  } else {
    const body = await req.json().catch(() => ({}));
    const parsed = jsonSchema.safeParse(body);
    if (!parsed.success) return new Response("Bad Request", { status: 400 });
    message = parsed.data.message;
    conversationId = parsed.data.conversationId;
    forceAgent = parsed.data.forceAgent;
  }

  const agent = VALID_AGENTS.includes(forceAgent as AgentType)
    ? (forceAgent as AgentType)
    : undefined;

  const fullMessage = fileContext ? `${message}\n${fileContext}` : message;
  const signal = req.signal;

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (s: string) => new TextEncoder().encode(s);

      try {
        for await (const event of orchestrateStream(
          session.user.id,
          fullMessage,
          conversationId,
          agent,
          signal,
        )) {
          if (signal.aborted) break;
          controller.enqueue(encode(`data: ${JSON.stringify(event)}\n\n`));
          // `done` event is yielded by the generator itself; close after forwarding it
          if (event.type === "done") break;
        }
      } catch (err) {
        if (!signal.aborted) {
          controller.enqueue(
            encode(
              `data: ${JSON.stringify({ type: "error", text: "Bir hata oluştu. Lütfen tekrar deneyin." })}\n\n`,
            ),
          );
          controller.enqueue(encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      // Client disconnected; req.signal handles Gemini fetch cancellation
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
