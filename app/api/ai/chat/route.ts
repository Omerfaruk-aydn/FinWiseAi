import { NextRequest } from "next/server";
import { z } from "zod";
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";
import { orchestrate, type AgentType } from "@/lib/ai/orchestrator";

const VALID_AGENTS: AgentType[] = [
  "SpendingAnalysisAgent", "BudgetPlannerAgent", "GoalPlannerAgent",
  "DebtRiskAgent", "SubscriptionWasteAgent", "FinancialHealthAgent",
  "ActionPlanAgent", "ReportAgent", "ExplanationAgent",
];

const chatSchema = z.object({
  message: z.string().min(1, "Mesaj boş olamaz.").max(2000),
  conversationId: z.string().optional(),
  forceAgent: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { message, conversationId, forceAgent } = parsed.data;
    const agent = VALID_AGENTS.includes(forceAgent as AgentType)
      ? (forceAgent as AgentType)
      : undefined;

    const result = await orchestrate(session.user.id, message, conversationId, agent);

    return successResponse({
      response: result.response,
      agentUsed: result.agentUsed,
      conversationId: result.conversationId,
      messageId: result.assistantMessageId,
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
