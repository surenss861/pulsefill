export type RecoveryHealthOverallStatus = "ready" | "needs_attention" | "setup_required" | "low_coverage";

export type RecoveryHealthSignalStatus = "ready" | "needs_attention" | "setup_required" | "low_coverage";

export type RecoveryHealthSignal = {
  status: RecoveryHealthSignalStatus;
  label: string;
  value: string;
  details: string;
};

export type RecoveryHealthNextAction = {
  label: string;
  href: string;
  priority: "primary" | "secondary";
};

export type RecoveryHealthResponse = {
  status: RecoveryHealthOverallStatus;
  headline: string;
  message: string;
  signals: {
    setup: RecoveryHealthSignal;
    standby_pool: RecoveryHealthSignal;
    notification_reach: RecoveryHealthSignal;
    recent_matching: RecoveryHealthSignal;
    claims: RecoveryHealthSignal;
  };
  next_actions: RecoveryHealthNextAction[];
};
