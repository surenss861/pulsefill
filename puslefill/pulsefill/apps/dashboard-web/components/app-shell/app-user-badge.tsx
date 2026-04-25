import { signOutAction } from "@/app/actions/auth";

type AppUserBadgeProps = {
  name: string | null;
  email: string;
  role: string;
};

function roleLabel(role: string) {
  if (!role) return "Operator";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function AppUserBadge({ name, email, role }: AppUserBadgeProps) {
  const initial = (name?.trim() || email || "P").slice(0, 1).toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderRadius: 999,
        border: "1px solid var(--pf-border-subtle)",
        background: "rgba(255, 255, 255, 0.03)",
        padding: "8px 10px 8px 8px",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 650,
          background: "rgba(255, 122, 24, 0.14)",
          color: "#ffb070",
        }}
      >
        {initial}
      </div>
      <div style={{ minWidth: 0, display: "none" }} className="pf-app-user-meta">
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--pf-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name?.trim() || "PulseFill operator"}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(245, 247, 250, 0.46)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {roleLabel(role)} · {email}
        </p>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          style={{
            borderRadius: 999,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.04)",
            color: "rgba(245, 247, 250, 0.78)",
            fontSize: 12,
            fontWeight: 600,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </form>
      <style>{`
        @media (min-width: 640px) {
          .pf-app-user-meta { display: block !important; }
        }
      `}</style>
    </div>
  );
}
