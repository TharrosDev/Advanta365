import type { InputHTMLAttributes } from "react";

type CheckboxProps = { label: string; count?: number } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

export function Checkbox({ label, count, disabled, ...rest }: CheckboxProps) {
  return (
    <label
      className={`flex min-h-9 items-center gap-2.5 text-sm ${disabled ? "text-muted/70" : "text-ink cursor-pointer"}`}
    >
      <input
        type="checkbox"
        disabled={disabled}
        className="accent-accent size-4 shrink-0"
        {...rest}
      />
      <span className="grow">{label}</span>
      {count !== undefined && <span className="text-muted text-xs tabular-nums">{count}</span>}
    </label>
  );
}
