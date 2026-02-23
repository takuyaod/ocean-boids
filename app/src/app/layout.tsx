import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

// アーケードフォント（Press Start 2P）を設定
const pressStart2P = Press_Start_2P({
  variable: "--font-press-start-2p",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "OCEAN-BOIDS",
  description: "Ocean Boids — 海洋生物の群れシミュレーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${pressStart2P.variable} antialiased bg-black`}>
        {children}
      </body>
    </html>
  );
}
