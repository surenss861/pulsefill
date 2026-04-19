"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export type ToastTone = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  title: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (input: { title: string; tone?: ToastTone }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyle = (tone: ToastTone): CSSProperties => {
  if (tone === "success") {
    return {
      border: "1px solid rgba(52, 211, 153, 0.35)",
      background: "rgba(16, 185, 129, 0.12)",
      color: "#a7f3d0",
    };
  }
  if (tone === "error") {
    return {
      border: "1px solid rgba(248, 113, 113, 0.35)",
      background: "rgba(239, 68, 68, 0.12)",
      color: "#fecaca",
    };
  }
  return {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.75)",
    color: "var(--text)",
  };
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(({ title, tone = "info" }: { title: string; tone?: ToastTone }) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now());
    const toast: ToastItem = { id, title, tone };

    setToasts((prev) => [...prev, toast]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          pointerEvents: "none",
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 360,
          width: "calc(100% - 32px)",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              borderRadius: 16,
              padding: "12px 16px",
              fontSize: 14,
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
              ...toneStyle(toast.tone),
            }}
          >
            {toast.title}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
