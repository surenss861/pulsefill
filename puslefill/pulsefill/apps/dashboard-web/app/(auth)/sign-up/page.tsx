import type { Metadata } from "next";
import SignUpClient from "@/components/auth/sign-up-client";

export const metadata: Metadata = {
  title: "Create account — PulseFill",
  description: "Create a PulseFill workspace for cancelled-appointment recovery.",
};

export default function SignUpPage() {
  return <SignUpClient />;
}
