"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { PageDialog } from "@/components/ui/page-dialog";
import { draftStore, readDraft, type Draft } from "@/lib/checkout/draft";
import { buildOrder, orderCode } from "@/lib/checkout/order";
import { getPaymentProvider } from "@/lib/checkout/provider";
import { parseDetails, type DetailField } from "@/lib/checkout/schema";
import {
  CHECKOUT_PARAM,
  CHECKOUT_STEPS,
  STEP_LABELS,
  checkoutHref,
  parseCheckoutStep,
  resolveStep,
  stepAnnouncement,
  stepNumber,
  stepState,
  type CheckoutStep,
} from "@/lib/checkout/steps";
import { cssVars, cx } from "@/lib/cx";
import { CONTACT_LINK } from "@/lib/site";
import styles from "./checkout-dialog.module.css";
import { DetailsStep, STEP_HEADING, fieldId } from "./details-step";
import { PaymentStep } from "./payment-step";
import { ReviewStep } from "./review-step";

/** The id of the heading in the bar that names the dialog. */
const TITLE = "checkout-title";

/**
 * The checkout: the site's page dialog over the Purchase page, open while the address says
 * `checkout=<step>`. Three steps, named in the bar with a line that grows to the current one:
 * "Your details", "Review" and "Payment", beside an order summary that is always there (`panel`,
 * the column from 68em; `disclosure`, a row that opens, below it; the page passes both, already
 * rendered, and the stylesheet shows one).
 *
 * The order is written in this tab and nowhere else: the draft lives in session storage
 * (`lib/checkout/draft.ts`), is read while rendering, and is saved on every change, so a refresh or
 * a visit to the Terms loses nothing. The address carries the name of the step and never a word of
 * the order. A step is one history entry with the dialog: moving between steps replaces the
 * address in place, so Back closes the checkout, as it closes the pop-up of the catalog, and the
 * draft is still there when it is opened again.
 *
 * An address may ask for a step the order has not reached (a link to `payment` with nothing
 * entered): the step shown is the furthest the order has come (`resolveStep`), and the address is
 * corrected to say so. On the server, and until the script has read the draft, the order is not
 * known: the first step is drawn as an empty form, and a later one as a line that says the order
 * is being opened.
 *
 * When the step changes, focus moves to its heading (or to the field an "Edit" on the review
 * named), the step is announced politely ("Step 2 of 3: Review"), and the new step settles into
 * place (`data-checkout-step` with `data-enter`, app/motion.css). Hooks: `data-checkout-dialog` on
 * the dialog, `data-checkout-step` on the step, `data-checkout-progress` on the line.
 */
export function CheckoutDialog({ panel, disclosure }: { panel: ReactNode; disclosure: ReactNode }) {
  const requested = parseCheckoutStep(useSearchParams().get(CHECKOUT_PARAM)) ?? "details";
  const stored = useSyncExternalStore(
    draftStore.subscribe,
    draftStore.getSnapshot,
    draftStore.getServerSnapshot,
  );
  const known = stored !== null;
  const draft = useMemo(() => readDraft(stored), [stored]);
  const step = known ? resolveStep(requested, draft) : requested;

  // What is said when the step changes, and whether the visitor has moved between steps at all.
  const [announcement, setAnnouncement] = useState("");
  const [moved, setMoved] = useState(false);
  // Where focus goes once the step that was asked for is on the page.
  const landing = useRef<{ step: CheckoutStep; id: string } | null>(null);

  // The address says the step that is shown, in place: a step is not a history entry of its own.
  useEffect(() => {
    if (known && step !== requested) window.history.replaceState(null, "", checkoutHref(step));
  }, [known, step, requested]);

  useEffect(() => {
    const target = landing.current;
    if (!target || target.step !== step) return;
    landing.current = null;
    document.getElementById(target.id)?.focus();
  }, [step]);

  const save = (patch: Partial<Draft>) => draftStore.save({ ...draft, ...patch });

  const go = (next: CheckoutStep, focusId: string = STEP_HEADING) => {
    landing.current = { step: next, id: focusId };
    setMoved(true);
    setAnnouncement(stepAnnouncement(next));
    window.history.replaceState(null, "", checkoutHref(next));
  };

  const confirm = () => {
    // The order gets its code once, the first time the review is confirmed, and keeps it.
    if (draft.reference === null || draft.createdAt === null) {
      const now = new Date();
      const entropy = window.crypto.getRandomValues(new Uint8Array(6));
      save({ reference: orderCode(now, entropy), createdAt: now.toISOString() });
    }
    go("payment");
  };

  const startOver = () => {
    draftStore.clear();
    go("details");
  };

  const parsed = parseDetails(draft.details);
  const order = buildOrder(draft);

  const bar = (
    <div className={styles.head}>
      <h2 id={TITLE} className={cx("type-item", styles.title)}>
        Checkout
      </h2>
      <p aria-hidden="true" className={cx("type-note", styles.count)}>
        Step {stepNumber(step)} of {CHECKOUT_STEPS.length}
      </p>
      <ol aria-label="Steps" className={styles.steps}>
        {CHECKOUT_STEPS.map((name) => {
          const state = stepState(name, step);
          return (
            <li
              key={name}
              data-state={state}
              aria-current={state === "current" ? "step" : undefined}
              className={cx("type-ui", styles.stepName)}
            >
              <span aria-hidden="true" className={cx("tabular", styles.numeral)}>
                {state === "done" ? <Icon name="tick" size={16} /> : stepNumber(name)}
              </span>
              {state === "done" ? <span className="visually-hidden">Done: </span> : null}
              {STEP_LABELS[name]}
            </li>
          );
        })}
      </ol>
    </div>
  );

  let content: ReactNode;
  if (step === "details") {
    content = (
      <DetailsStep
        details={draft.details}
        onChange={(patch) => save({ details: { ...draft.details, ...patch } })}
        onContinue={() => go("review")}
      />
    );
  } else if (step === "review" && parsed.ok) {
    content = (
      <ReviewStep
        details={parsed.details}
        agreed={draft.agreed}
        onAgree={(agreed) => save({ agreed })}
        onEdit={(field?: DetailField) => go("details", field ? fieldId(field) : STEP_HEADING)}
        onConfirm={confirm}
      />
    );
  } else if (step === "payment" && order) {
    content = (
      <PaymentStep
        order={order}
        provider={getPaymentProvider()}
        onBack={() => go("review")}
        onStartOver={startOver}
      />
    );
  } else {
    // The server's page, and the first moment of the browser's: the order has not been read yet.
    content = (
      <div className={styles.waiting}>
        <p className="type-copy">Opening your order…</p>
        <noscript>
          <p className="type-copy">
            The checkout needs JavaScript to keep your order on this device. To order without it,
            write to us from the <a href={CONTACT_LINK.href}>contact page</a>.
          </p>
        </noscript>
      </div>
    );
  }

  return (
    <PageDialog name="checkout" closeHref={checkoutHref()} labelledBy={TITLE} bar={bar} fill>
      <div className={styles.layout}>
        <div aria-hidden="true" className={styles.track}>
          <span
            data-checkout-progress=""
            className={styles.progress}
            style={cssVars({ "--done": stepNumber(step) / CHECKOUT_STEPS.length })}
          />
        </div>
        <div className={styles.main}>
          <p role="status" className="visually-hidden">
            {announcement}
          </p>
          <div className={styles.disclosure}>{disclosure}</div>
          <div
            key={step}
            data-checkout-step={step}
            data-enter={moved ? "" : undefined}
            className={styles.step}
          >
            {content}
          </div>
        </div>
        <aside className={styles.side}>{panel}</aside>
      </div>
    </PageDialog>
  );
}
