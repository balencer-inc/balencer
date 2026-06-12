import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "BALENCER Outreach — 営業メール自動化",
  description: "バレンサーのサービスを中堅・中小企業に届ける半自動メール配信ツール",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <Sidebar />
        <main className="ml-[240px] min-h-screen">{children}</main>
      </body>
    </html>
  );
}
