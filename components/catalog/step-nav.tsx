import { Button } from "@/components/ui/button";
import type { Step } from "@/lib/catalog/schema";
import styles from "./step-nav.module.css";

/**
 * The steps of one phase as in-page links, in order: a wrapping row of small outline buttons. Each
 * one jumps to the `<section id>` of its step.
 */
export function StepNav({ steps }: { steps: readonly Step[] }) {
  return (
    <nav aria-label="Steps in this phase">
      <ul className={styles.list}>
        {steps.map((step) => (
          <li key={step.slug}>
            <Button variant="outline" size="sm" href={`#${step.slug}`}>
              {step.name}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
