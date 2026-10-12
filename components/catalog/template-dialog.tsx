import type { ReactNode } from "react";
import { PageDialog } from "@/components/ui/page-dialog";

/**
 * The pop-up of the catalog: the site's page dialog (`PageDialog`, which holds all of its
 * behaviour) for one free sample. The page renders it only while the address names a free sample
 * (`view`); it closes to `closeHref`, the same address without `view`. Hook: `data-template-dialog`.
 *
 * `labelledBy` is the id of the heading inside `children` that names it.
 */
export function TemplateDialog({
  closeHref,
  labelledBy,
  children,
}: {
  closeHref: string;
  labelledBy: string;
  children: ReactNode;
}) {
  return (
    <PageDialog name="template" closeHref={closeHref} labelledBy={labelledBy}>
      {children}
    </PageDialog>
  );
}
