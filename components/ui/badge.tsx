import type { ReactNode } from "react";

type BadgeProps = { tone?: "neutral" | "accent"; children: ReactNode };

export function Badge({ tone = "neutral", children }: BadgeProps) {
  const toneClass =
    tone === "accent" ? "bg-accent-soft text-accent" : "border border-rule bg-surface text-muted";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${toneClass}`}
    >
      {children}
    </span>
  );
}
