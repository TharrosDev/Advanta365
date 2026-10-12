import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Note } from "@/components/ui/note";
import { Select } from "@/components/ui/select";
import { TextLink } from "@/components/ui/text-link";
import { Textarea } from "@/components/ui/textarea";
import { DETAIL_LABELS } from "@/lib/checkout/order";
import { legalLink } from "@/lib/checkout/links";
import { COUNTRIES, regionLabel, regionsOf } from "@/lib/checkout/places";
import {
  DETAIL_FIELDS,
  DETAIL_LIMITS,
  parseDetails,
  type DetailField,
  type DetailsDraft,
} from "@/lib/checkout/schema";
import { cx } from "@/lib/cx";
import { CONTACT_LINK } from "@/lib/site";
import { ErrorSummary, Field } from "./field";
import styles from "./step.module.css";

const PRIVACY = legalLink("/privacy");

/** The id of a field's control: what its label, its error link and an "Edit" on the review point at. */
export const fieldId = (field: DetailField) => `checkout-${field}`;

/** The id of the heading of the step in view, which takes focus when the step changes. */
export const STEP_HEADING = "checkout-step-heading";

/**
 * Step one: who the order is for. Seven fields in one form: full name, work email, organization,
 * country (a native select, Canada first), the region (a select of provinces or of states for
 * Canada and the United States, a free line anywhere else), and two that may stay empty, a purchase
 * order or reference number and a note.
 *
 * A field is checked when the keyboard leaves it and all of them when the form is sent; a field's
 * error stands under it, and a form sent with something wrong gets a summary at its head, which
 * takes focus and links to each field. Enter sends the form. The values belong to the caller
 * (`details`, `onChange`), which keeps them in this tab; nothing here is sent anywhere. The form's
 * method is `dialog`, so a browser without the script closes the pop-up on Continue and puts
 * nothing in the address.
 */
export function DetailsStep({
  details,
  onChange,
  onContinue,
}: {
  details: DetailsDraft;
  onChange: (patch: Partial<DetailsDraft>) => void;
  onContinue: () => void;
}) {
  // The fields the keyboard has left, and how many times the form was sent with something wrong.
  const [touched, setTouched] = useState<ReadonlySet<DetailField>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);

  const result = parseDetails(details);
  const shown = (field: DetailField) =>
    attempts > 0 || touched.has(field) ? result.errors[field] : undefined;
  const problems =
    attempts > 0
      ? DETAIL_FIELDS.flatMap((field) => {
          const message = result.errors[field];
          return message ? [{ id: fieldId(field), message }] : [];
        })
      : [];

  // A form sent with something wrong: the summary is on the page by now, and takes focus.
  useEffect(() => {
    if (attempts > 0) summaryRef.current?.focus();
  }, [attempts]);

  const touch = (field: DetailField) =>
    setTouched((before) => (before.has(field) ? before : new Set(before).add(field)));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (result.ok) onContinue();
    else setAttempts((count) => count + 1);
  };

  const text = (field: Exclude<DetailField, "country">) => ({
    name: field,
    value: details[field],
    maxLength: DETAIL_LIMITS[field],
    onChange: (event: { target: { value: string } }) => onChange({ [field]: event.target.value }),
    onBlur: () => touch(field),
  });

  const regions = regionsOf(details.country);

  return (
    <form method="dialog" noValidate onSubmit={submit} className={styles.form}>
      <div className={styles.content}>
        <h3 id={STEP_HEADING} tabIndex={-1} className={cx("type-page", styles.heading)}>
          Your details
        </h3>
        <p className={cx("type-copy", styles.lead)}>
          Who the order and its invoice are for. Fields marked{" "}
          <span aria-hidden="true" className={styles.star}>
            *
          </span>
          <span className="visually-hidden">with an asterisk</span> are needed.
        </p>

        <noscript>
          <Note className={styles.notice}>
            The checkout needs JavaScript to keep your order on this device. To order without it,
            write to us from the <a href={CONTACT_LINK.href}>contact page</a>.
          </Note>
        </noscript>

        {problems.length > 0 ? <ErrorSummary ref={summaryRef} problems={problems} /> : null}

        <div className={styles.fields}>
          <Field
            id={fieldId("fullName")}
            label={DETAIL_LABELS.fullName}
            required
            error={shown("fullName")}
            className={styles.wide}
          >
            {(control) => (
              <Input
                {...control}
                {...text("fullName")}
                type="text"
                autoComplete="name"
                autoCapitalize="words"
                spellCheck={false}
              />
            )}
          </Field>

          <Field
            id={fieldId("email")}
            label={DETAIL_LABELS.email}
            required
            hint="Where we reply about your order."
            error={shown("email")}
            className={styles.wide}
          >
            {(control) => (
              <Input
                {...control}
                {...text("email")}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
              />
            )}
          </Field>

          <Field
            id={fieldId("organization")}
            label={DETAIL_LABELS.organization}
            required
            error={shown("organization")}
            className={styles.wide}
          >
            {(control) => (
              <Input
                {...control}
                {...text("organization")}
                type="text"
                autoComplete="organization"
              />
            )}
          </Field>

          <Field
            id={fieldId("country")}
            label={DETAIL_LABELS.country}
            required
            error={shown("country")}
          >
            {(control) => (
              <Select
                {...control}
                name="country"
                autoComplete="country"
                value={details.country}
                // A region belongs to its country: another country starts it empty.
                onChange={(event) => onChange({ country: event.target.value, region: "" })}
                onBlur={() => touch("country")}
              >
                <option value="">Choose a country</option>
                {COUNTRIES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            id={fieldId("region")}
            label={regionLabel(details.country)}
            required={regions !== undefined}
            error={shown("region")}
          >
            {(control) =>
              regions ? (
                <Select
                  {...control}
                  name="region"
                  autoComplete="address-level1"
                  value={details.region}
                  onChange={(event) => onChange({ region: event.target.value })}
                  onBlur={() => touch("region")}
                >
                  <option value="">Choose one</option>
                  {regions.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input {...control} {...text("region")} type="text" autoComplete="address-level1" />
              )
            }
          </Field>

          <Field
            id={fieldId("poNumber")}
            label={DETAIL_LABELS.poNumber}
            hint="If your organization buys by purchase order, it goes on the invoice."
            error={shown("poNumber")}
            className={styles.wide}
          >
            {(control) => (
              <Input
                {...control}
                {...text("poNumber")}
                type="text"
                autoComplete="off"
                spellCheck={false}
              />
            )}
          </Field>

          <Field
            id={fieldId("note")}
            label={DETAIL_LABELS.note}
            hint="Anything we should know: who approves the invoice, a billing address, a deadline."
            error={shown("note")}
            className={styles.wide}
          >
            {(control) => <Textarea {...control} {...text("note")} autoComplete="off" />}
          </Field>
        </div>

        <p className={cx("type-note", styles.privacy)}>
          Your details stay in this browser tab until you choose to send them.{" "}
          <TextLink href={PRIVACY.href} external>
            {PRIVACY.label}
            <span className="visually-hidden"> (opens in a new tab)</span>
          </TextLink>
        </p>
      </div>

      <div className={styles.actions}>
        <Button type="submit" size="lg" arrow>
          Continue to review
        </Button>
      </div>
    </form>
  );
}
