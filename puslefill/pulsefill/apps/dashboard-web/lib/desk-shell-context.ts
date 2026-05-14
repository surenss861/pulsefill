/** Route-aware copy for the protected app header (sidebar owns the PulseFill mark). */
export function deskContextForPath(pathname: string): { kicker: string; subtitle: string } {
  const p = pathname || "";

  if (p === "/" || p.startsWith("/overview")) {
    return {
      kicker: "Today's desk",
      subtitle: "What needs attention — openings, waitlist, confirmations.",
    };
  }
  if (p.startsWith("/open-slots")) {
    return {
      kicker: "Appointment files",
      subtitle: "Cancelled times you can match to waiting customers.",
    };
  }
  if (p.startsWith("/customers")) {
    return {
      kicker: "Waitlist book",
      subtitle: "People PulseFill can contact when a spot opens.",
    };
  }
  if (p.startsWith("/activity")) {
    return {
      kicker: "Recovery log",
      subtitle: "Openings, offers, claims, and notes — newest first.",
    };
  }
  if (p.startsWith("/settings")) {
    return {
      kicker: "Workspace",
      subtitle: "Account, recovery settings, and how PulseFill runs for you.",
    };
  }
  if (p.startsWith("/billing")) {
    return {
      kicker: "Billing file",
      subtitle: "Subscription and invoice status.",
    };
  }
  if (p.startsWith("/action-queue")) {
    return {
      kicker: "Action queue",
      subtitle: "Items that need a tap from the team.",
    };
  }
  if (p.startsWith("/claims")) {
    return {
      kicker: "Claims",
      subtitle: "Customer responses to openings.",
    };
  }
  if (p.startsWith("/analytics") || p.startsWith("/outcomes")) {
    return {
      kicker: "Outcomes",
      subtitle: "Recovery results over time.",
    };
  }
  if (p.startsWith("/locations") || p.startsWith("/providers") || p.startsWith("/services")) {
    return {
      kicker: "Workspace setup",
      subtitle: "Locations, providers, and visit types.",
    };
  }

  return {
    kicker: "Operations desk",
    subtitle: "Openings, waitlist, recovery, and workspace.",
  };
}
