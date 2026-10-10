import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`min-h-11 rounded-md border border-ink/25 bg-surface px-3 text-sm text-ink ${className}`.trim()}
      {...rest}
    >
      {children}
    </select>
  );
}
