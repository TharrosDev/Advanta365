import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-11 w-full rounded-md border border-ink/25 bg-surface px-3 text-base text-ink placeholder:text-muted ${className}`.trim()}
      {...rest}
    />
  );
}
