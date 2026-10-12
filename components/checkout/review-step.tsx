import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TextLink } from "@/components/ui/text-link";
import { legalLink } from "@/lib/checkout/links";
import { detailRows } from "@/lib/checkout/order";
import type { DetailField, OrderDetails } from "@/lib/checkout/schema";
import { cx } from "@/lib/cx";
import { STEP_HEADING } from "./details-step";
import { ErrorSummary, FieldError } from "./field";
import styles from "./step.module.css";

const TERMS = legalLink("/terms");
const REFUNDS = legalLink("/refunds");

const AGREE = "checkout-agree";
const AGREE_HINT = "checkout-agree-hint";
const AGREE_ERROR = "checkout-agree-error";
const AGREE_MISSING = "Agree to the Terms and the Refund policy to continue";

/**
 * Step two: everything that was entered, read back, each row with a way to change it (an "Edit"
 * that returns to step one with the keyboard on that field), and the one thing still asked: a
 * checkbox agreeing to the Terms and the Refund policy. The two pages open in a new tab, so the
 * order stays as it is. Sent without the box ticked, the form says so in a summary that takes focus
 * and under the box itself. Enter sends the form.
 */
export function ReviewStep({
  details,
  agreed,
  onAgree,
  onEdit,
  onConfirm,
}: {
  details: OrderDetails;
  agreed: boolean;
  onAgree: (agreed: boolean) => void;
  /** Returns to step one: on a field, or on its heading without one. */
  onEdit: (field?: DetailField) => void;
  onConfirm: () => void;
}) {
  const [attempts, setAttempts] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const missing = attempts > 0 && !agreed;

  useEffect(() => {
    if (attempts > 0) summaryRef.current?.focus();
  }, [attempts]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (agreed) onConfirm();
    else setAttempts((count) => count + 1);
  };

  return (
    <form method="dialog" noValidate onSubmit={submit} className={styles.form}>
      <div className={styles.content}>
        <h3 id={STEP_HEADING} tabIndex={-1} className={cx("type-page", styles.heading)}>
          Review
        </h3>
        <p className={cx("type-copy", styles.lead)}>
          Check the order before you go on. Nothing has been sent yet.
        </p>

        {missing ? (
          <ErrorSummary ref={summaryRef} problems={[{ id: AGREE, message: AGREE_MISSING }]} />
        ) : null}

        <dl className={styles.rows}>
          {detailRows(details).map((row) => (
            <div key={row.field} className={styles.row}>
              <dt className={cx("type-eyebrow", styles.term)}>{row.label}</dt>
              <dd className={cx("type-copy", styles.value, !row.value && styles.empty)}>
                {row.value || "Not given"}
              </dd>
              <dd className={styles.edit}>
                <Button variant="text" onClick={() => onEdit(row.field)}>
                  Edit
                  <span className="visually-hidden"> {row.label.toLowerCase()}</span>
                </Button>
              </dd>
            </div>
          ))}
        </dl>

        <div className={styles.agree}>
          <p id={AGREE_HINT} className={cx("type-copy", styles.terms)}>
            Read the{" "}
            <TextLink href={TERMS.href} external>
              {TERMS.label}
              <span className="visually-hidden"> (opens in a new tab)</span>
            </TextLink>{" "}
            and the{" "}
            <TextLink href={REFUNDS.href} external>
              Refund policy
              <span className="visually-hidden"> (opens in a new tab)</span>
            </TextLink>
            . Each opens in a new tab, so this order stays as it is.
          </p>
          <Checkbox
            id={AGREE}
            name="agree"
            label="I agree to the Terms and the Refund policy"
            checked={agreed}
            onChange={(event) => onAgree(event.target.checked)}
            required
            aria-invalid={missing ? true : undefined}
            aria-describedby={missing ? `${AGREE_HINT} ${AGREE_ERROR}` : AGREE_HINT}
          />
          {missing ? <FieldError id={AGREE_ERROR}>{AGREE_MISSING}</FieldError> : null}
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="outline" size="lg" onClick={() => onEdit()}>
          Back
        </Button>
        <Button type="submit" size="lg" arrow>
          Continue to payment
        </Button>
      </div>
    </form>
  );
}
