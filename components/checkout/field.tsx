import type { MouseEvent, ReactNode, Ref } from "react";
import { cx } from "@/lib/cx";
import styles from "./field.module.css";

/** What a field hands its control: the id its label points at, and how it is described. */
export type FieldControl = {
  id: string;
  required: boolean;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
};

/**
 * One field of a form: its label, an optional hint, the control and, when there is one, its error.
 * The label is a real `<label>` for the control's `id`. A field that is needed carries an asterisk
 * (the form says once what it means) and its control is `required`; one that is not says
 * "(optional)" in words. The hint and the error are tied to the control with `aria-describedby`,
 * the error also with `aria-invalid`, and the error's line opens with "Error:" for a reader that
 * cannot see its colour.
 *
 * `children` draws the control from what the field hands it, so any control of the kit fits.
 */
export function Field({
  id,
  label,
  required = false,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: (control: FieldControl) => ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cx(styles.field, error && styles.invalid, className)}>
      <label htmlFor={id} className={cx("type-ui", styles.label)}>
        {label}
        {required ? (
          <span aria-hidden="true" className={styles.star}>
            {" "}
            *
          </span>
        ) : (
          <span className={styles.optional}> (optional)</span>
        )}
      </label>
      {hint ? (
        <p id={hintId} className={cx("type-note", styles.hint)}>
          {hint}
        </p>
      ) : null}
      {children({
        id,
        required,
        "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

/** The line under a control that says what to put right. */
export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} data-field-error="" className={cx("type-note", styles.error)}>
      <span className="visually-hidden">Error: </span>
      {children}
    </p>
  );
}

export type Problem = { id: string; message: string };

/**
 * What stands at the head of a form that was sent with something wrong: how many problems there
 * are, and each as a link that puts the keyboard on its control. The form moves focus here, so the
 * count is the first thing read; the box takes focus from script only (`tabIndex={-1}`).
 */
export function ErrorSummary({
  ref,
  problems,
}: {
  ref?: Ref<HTMLDivElement>;
  problems: readonly Problem[];
}) {
  const toControl = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    document.getElementById(id)?.focus();
  };

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="group"
      aria-labelledby="checkout-problems"
      data-error-summary=""
      className={styles.summary}
    >
      <h4 id="checkout-problems" className={cx("type-ui", styles.summaryTitle)}>
        {problems.length === 1
          ? "There is a problem to put right"
          : `There are ${problems.length} problems to put right`}
      </h4>
      <ul className={styles.problems}>
        {problems.map((problem) => (
          <li key={problem.id}>
            <a
              href={`#${problem.id}`}
              className={cx("type-ui", styles.problem)}
              onClick={(event) => toControl(event, problem.id)}
            >
              {problem.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
