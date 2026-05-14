import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "FinWise AI - Akıllı Kişisel Finans Koçu",
    template: "%s | FinWise AI",
  },
  description:
    "FinWise AI gelir, gider, borç ve hedeflerini analiz ederek sana kişisel bütçe planı, tasarruf önerileri ve haftalık aksiyon listesi sunar.",
  keywords: ["finans", "bütçe", "tasarruf", "yapay zeka", "kişisel finans"],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="font-sans">
        {children}
        <Toaster
          position="top-right"
          richColors
          duration={4000}
          closeButton
        />
      </body>
    </html>
  );
}
