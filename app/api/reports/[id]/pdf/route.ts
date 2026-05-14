import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { unauthorizedResponse, notFoundResponse, internalErrorResponse } from "@/lib/api-response";
import puppeteer from "puppeteer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;

    const report = await prisma.report.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!report) return notFoundResponse("Rapor");

    const content = report.contentJson ? JSON.parse(report.contentJson) : {};

    const periodStart = new Date(report.periodStart).toLocaleDateString("tr-TR");
    const periodEnd = new Date(report.periodEnd).toLocaleDateString("tr-TR");
    const createdAt = new Date(report.createdAt).toLocaleDateString("tr-TR");

    const htmlContent = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>${report.title}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #0F172A; line-height: 1.6; }
  .header { text-align: center; border-bottom: 2px solid #10B981; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { font-size: 28px; font-weight: bold; color: #10B981; }
  h1 { font-size: 22px; margin: 10px 0; }
  .meta { color: #64748B; font-size: 14px; }
  .section { margin: 25px 0; page-break-inside: avoid; }
  .section h2 { font-size: 18px; color: #0F172A; border-left: 4px solid #10B981; padding-left: 12px; }
  ul { padding-left: 20px; }
  li { margin: 6px 0; }
  .insight { background: #F0FDF4; border-left: 3px solid #10B981; padding: 10px 15px; margin: 10px 0; border-radius: 4px; }
  .recommendation { background: #EFF6FF; border-left: 3px solid #3B82F6; padding: 10px 15px; margin: 10px 0; border-radius: 4px; }
  .disclaimer { background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 15px; margin-top: 40px; font-size: 12px; color: #92400E; page-break-inside: avoid; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; color: #64748B; font-size: 12px; }
</style>
</head>
<body>
<div class="header">
  <div class="logo">FinWise AI</div>
  <h1>${report.title}</h1>
  <div class="meta">Dönem: ${periodStart} - ${periodEnd} | Oluşturulma: ${createdAt}</div>
</div>

<div class="section">
  <h2>Özet</h2>
  <p>${report.summary ?? content.summary ?? ""}</p>
</div>

${content.highlights?.length > 0 ? `
<div class="section">
  <h2>Öne Çıkanlar</h2>
  <ul>
    ${content.highlights.map((h: string) => `<li>${h}</li>`).join("")}
  </ul>
</div>
` : ""}

${content.keyInsights?.length > 0 ? `
<div class="section">
  <h2>Temel İçgörüler</h2>
  ${content.keyInsights.map((i: { title: string; description: string }) => `
    <div class="insight"><strong>${i.title}</strong><br>${i.description}</div>
  `).join("")}
</div>
` : ""}

${content.recommendations?.length > 0 ? `
<div class="section">
  <h2>Öneriler</h2>
  ${content.recommendations.map((r: { title: string; action: string }) => `
    <div class="recommendation"><strong>${r.title}</strong><br>${r.action}</div>
  `).join("")}
</div>
` : ""}

${content.nextPeriodGoals?.length > 0 ? `
<div class="section">
  <h2>Bir Sonraki Dönem Hedefleri</h2>
  <ul>
    ${content.nextPeriodGoals.map((g: string) => `<li>${g}</li>`).join("")}
  </ul>
</div>
` : ""}

<div class="disclaimer">
  <strong>Önemli Uyarı:</strong> Bu bilgiler yalnızca genel bilgilendirme amaçlıdır; kişisel finansal yatırım tavsiyesi niteliği taşımaz.
</div>

<div class="footer">
  FinWise AI | Akıllı Kişisel Finans Koçu | ${createdAt}
</div>
</body>
</html>`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "load" });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '40px', right: '40px', bottom: '40px', left: '40px' },
      printBackground: true
    });
    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="finwise-rapor-${id}.pdf"`,
      },
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
