import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseFill — Appointment recovery",
  description:
    "When someone cancels, PulseFill matches your waitlist, sends timed offers, and helps staff confirm the booking so revenue does not walk out the door.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
