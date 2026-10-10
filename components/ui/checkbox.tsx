import type { InputHTMLAttributes } from "react";

type CheckboxProps = { label: string; count?: number } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

export function Checkbox({ label, count, disabled, ...rest }: CheckboxProps) {
  return (
    <label
      className={`flex min-h-9 items-center gap-2.5 text-sm ${disabled ? "text-muted/70" : "cursor-pointer text-ink"}`}
    >
      <input type="checkbox" disabled={disabled} className="size-4 shrink-0 accent-accent" {...rest} />
      <span className="grow">{label}</span>
      {count !== undefined && <span className="text-xs text-muted tabular-nums">{count}</span>}
    </label>
  );
}
