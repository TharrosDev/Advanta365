import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`border-ink/25 bg-surface text-ink placeholder:text-muted min-h-11 w-full rounded-md border px-3 text-base ${className}`.trim()}
      {...rest}
    />
  );
}
