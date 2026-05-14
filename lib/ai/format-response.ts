import type { AIResponse } from "./schemas";

function uniqueByText<T>(items: T[], getText: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getText(item).trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatAIResponseForChat(response: AIResponse): string {
  const sections: string[] = [response.summary.trim()];

  if (response.diagnosis.explanation) {
    sections.push(`**Kısa değerlendirme:** ${response.diagnosis.explanation.trim()}`);
  }

  const insights = uniqueByText(response.insights, (item) => item.title).slice(0, 3);
  if (insights.length > 0) {
    sections.push(
      [
        "**Öne çıkan noktalar:**",
        ...insights.map((item) => `- **${item.title}:** ${item.description}`),
      ].join("\n"),
    );
  }

  const recommendations = uniqueByText(response.recommendations, (item) => item.title).slice(0, 3);
  if (recommendations.length > 0) {
    sections.push(
      [
        "**En iyi sonraki adımlar:**",
        ...recommendations.map((item, index) => {
          const impact = item.estimatedImpact ? ` Etki: ${item.estimatedImpact}` : "";
          return `${index + 1}. **${item.title}:** ${item.action}${impact}`;
        }),
      ].join("\n"),
    );
  }

  const actionItems = uniqueByText(response.actionItems, (item) => item.title).slice(0, 3);
  if (actionItems.length > 0) {
    sections.push(
      [
        "**Uygulanabilir mini plan:**",
        ...actionItems.map((item) => {
          const due = typeof item.dueInDays === "number" ? ` (${item.dueInDays} gün içinde)` : "";
          return `- **${item.title}${due}:** ${item.description}`;
        }),
      ].join("\n"),
    );
  }

  if (response.followUps?.length) {
    sections.push(
      [
        "**İstersen buradan devam edebiliriz:**",
        ...response.followUps.slice(0, 3).map((item) => `- ${item}`),
      ].join("\n"),
    );
  }

  return sections.join("\n\n");
}
