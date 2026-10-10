import type { ReactNode } from "react";

type CardProps = { as?: "div" | "article" | "section"; className?: string; children: ReactNode };

export function Card({ as: Tag = "div", className = "", children }: CardProps) {
  return (
    <Tag className={`rounded-lg border border-rule bg-surface p-5 sm:p-6 ${className}`.trim()}>
      {children}
    </Tag>
  );
}
