import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseFill — Operating system for appointment recovery",
  description:
    "Recover near-term openings with standby demand, operator action, and measurable recovery — cancellations are inevitable; lost revenue is not.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
