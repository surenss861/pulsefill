import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseFill — Business",
  description: "Recover cancelled appointments in minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
