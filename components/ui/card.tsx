import type { ReactNode } from "react";

type CardProps = { as?: "div" | "article" | "section"; className?: string; children: ReactNode };

export function Card({ as: Tag = "div", className = "", children }: CardProps) {
  return (
    <Tag className={`border-rule bg-surface rounded-lg border p-5 sm:p-6 ${className}`.trim()}>
      {children}
    </Tag>
  );
}
