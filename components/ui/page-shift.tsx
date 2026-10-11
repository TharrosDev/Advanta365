import { ViewTransition, type ReactNode } from "react";

/**
 * The first block of a page (a title block, the hero's text, the text of the 404), wrapped so it
 * leaves and arrives when the route changes: the leaving block fades, the arriving one inks in
 * (app/motion.css, the classes `page-out` and `page-in`). A change inside the same page, such as
 * the catalog's search parameters, is an update and never animates. Wrap one block, never a
 * whole page. Without the View Transitions API, and under reduced motion, navigation is instant.
 */
export function PageShift({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" update="none" default="none">
      {children}
    </ViewTransition>
  );
}
