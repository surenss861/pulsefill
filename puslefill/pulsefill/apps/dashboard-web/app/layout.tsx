import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseFill — The missing layer between cancellations and recovered bookings",
  description:
    "Recovery infrastructure for appointment businesses: standby matching, operator workflow, and measurable revenue recovery.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
