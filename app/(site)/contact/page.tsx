import type { Metadata } from "next";
import { PageTitle } from "@/components/layout/page-title";
import { Reveal, RevealWords } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { ActionRow } from "@/components/ui/action-row";
import { PageShell } from "@/components/ui/page-shell";
import { SectionLabel } from "@/components/ui/section-label";
import { SectionShell } from "@/components/ui/section-shell";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about the templates, licensing or purchasing for your organization.",
};

export default function ContactPage() {
  return (
    <PageShell>
      <PageTitle
        title="Contact"
        lead="Questions about a template, licensing for your organization, or buying by purchase order?"
      />

      <SectionShell innerClassName={styles.contacts}>
        <RevealGroup className={styles.intro}>
          <Reveal as="div" effect="fade" index={0}>
            <SectionLabel>Contact</SectionLabel>
          </Reveal>
          <h2 className={cx("t-display-fluid", styles.statement)}>
            <RevealWords text="Send an email and you will get a reply from a person." offset={1} />
          </h2>
        </RevealGroup>
        <RevealGroup className={styles.rows}>
          <Reveal as="div" effect="fade-up" index={0}>
            <ActionRow
              fill
              size="lg"
              rule="both"
              href={`mailto:${SITE.contactEmail}`}
              label={SITE.contactEmail}
              caption="For general questions"
            />
          </Reveal>
        </RevealGroup>
      </SectionShell>
    </PageShell>
  );
}
