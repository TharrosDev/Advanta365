import type { SelectHTMLAttributes } from "react";

export function Select({
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`border-ink/25 bg-surface text-ink min-h-11 rounded-md border px-3 text-sm ${className}`.trim()}
      {...rest}
    >
      {children}
    </select>
  );
}
