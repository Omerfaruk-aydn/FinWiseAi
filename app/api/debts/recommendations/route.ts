import { prisma } from "@/lib/prisma";
import {
  internalErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";

export async function POST() {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const [debts, overview] = await Promise.all([
      prisma.debt.findMany({
        where: { userId: session.user.id, status: "ACTIVE" },
        orderBy: [{ interestRate: "desc" }, { remainingAmount: "desc" }],
      }),
      prisma.income.aggregate({
        where: { userId: session.user.id },
        _sum: { amount: true },
      }),
    ]);

    const totalRemaining = debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
    const totalMinPayment = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    const estimatedIncome = overview._sum.amount ?? 0;
    const highestInterestDebt = debts[0] ?? null;
    const debtLoadRatio = estimatedIncome > 0 ? (totalMinPayment / estimatedIncome) * 100 : 0;

    const recommendations = [
      highestInterestDebt
        ? `${highestInterestDebt.title} borcunda faiz oranı en yüksek; ekstra ödemeyi önce buraya yönlendir.`
        : "Aktif borç kaydı bulunmuyor.",
      totalMinPayment > 0
        ? `Aylık minimum ödeme toplamı ${totalMinPayment.toLocaleString("tr-TR")} TL; otomatik ödeme hatırlatıcısı kur.`
        : "Minimum ödeme yükümlülüğü yok.",
      debtLoadRatio > 40
        ? "Borç yükü kritik seviyede; yeni taksit veya kredi kullanmadan önce planı daralt."
        : "Borç yükünü düşük tutmak için minimumun üzerinde ödeme yap.",
    ];

    const now = new Date();
    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        title: "Borç Risk Önerileri",
        type: "MONTHLY",
        periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
        periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        summary: `Toplam aktif borç ${totalRemaining.toLocaleString("tr-TR")} TL. ${recommendations[0]}`,
        contentJson: JSON.stringify({
          totalRemaining,
          totalMinPayment,
          debtLoadRatio,
          recommendations,
          debts,
        }),
      },
    });

    return successResponse(report, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
