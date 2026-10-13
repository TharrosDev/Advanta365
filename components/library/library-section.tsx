import { FileDownloads } from "@/components/catalog/file-downloads";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { Note } from "@/components/ui/note";
import { Split } from "@/components/ui/split";
import { TextLink } from "@/components/ui/text-link";
import type { Phase, Template } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import styles from "./library-section.module.css";

const TITLE = "Your toolkit";

/**
 * The Library page. `open`: the title block, then one paper band per phase that has files, the phase
 * name in the margin and each template's title over its download links. `unavailable`: the buyer
 * holds a licence but the server has no file store. `locked`: no licence in this browser, and how to
 * get one; `linkFailed` puts "That link did not work." first.
 */
export function LibrarySection({
  state,
  linkFailed,
  phases,
  templates,
}: {
  state: "open" | "unavailable" | "locked";
  linkFailed: boolean;
  phases: Phase[];
  templates: Template[];
}) {
  const contact = <TextLink href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</TextLink>;

  if (state !== "open") {
    return (
      <TitleBlock
        title={TITLE}
        lead={
          state === "unavailable" ? (
            <>
              Downloads are not available right now. Write to {contact} and we will send your files.
            </>
          ) : (
            <>
              Open the link from your order email to see your files here. If it does not work, write
              to {contact} with your order code.
            </>
          )
        }
      >
        {linkFailed && state === "locked" ? <Note>That link did not work.</Note> : null}
      </TitleBlock>
    );
  }

  const shelves = phases
    .map((phase) => ({ phase, items: templates.filter((t) => t.phase === phase.slug) }))
    .filter((shelf) => shelf.items.length > 0);

  return (
    <>
      <TitleBlock
        title={TITLE}
        lead="Every file in the toolkit, by phase. Download what you need; this page keeps working in this browser."
      />
      {shelves.map(({ phase, items }) => (
        <Band key={phase.slug} surface="paper" pad="tight">
          <Split
            margin={
              <h2 id={`phase-${phase.slug}`} className="type-section">
                {phase.name}
              </h2>
            }
          >
            <BandedList aria-labelledby={`phase-${phase.slug}`}>
              {items.map((template) => (
                <BandedRow key={template.slug} className={styles.row}>
                  <p className={cx("type-item", styles.title)}>
                    <KeepCompounds text={template.title} />
                  </p>
                  <FileDownloads
                    files={template.files}
                    hrefFor={(file) => `/api/library/${template.slug}/${file.id}`}
                  />
                </BandedRow>
              ))}
            </BandedList>
          </Split>
        </Band>
      ))}
    </>
  );
}
