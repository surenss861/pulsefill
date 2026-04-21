import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseFill — Appointment recovery",
  description:
    "Recover same-day and near-term cancellations through a two-sided standby system and operator recovery workflow.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
