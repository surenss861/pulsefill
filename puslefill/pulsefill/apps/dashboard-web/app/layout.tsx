import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseFill — Appointment recovery",
  description:
    "When someone cancels, PulseFill matches your waitlist, sends timed offers, and helps staff confirm the booking so revenue does not walk out the door.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
