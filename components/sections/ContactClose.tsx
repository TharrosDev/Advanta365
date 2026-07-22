import { contact, contactSection } from "@/lib/content";

/**
 * The sign-off plate — the drawing's approval stamp, kept light: a cobalt-
 * framed card on a pale cobalt wash, the family's conversion moment
 * re-tuned away from the old dark drench. Server component.
 */
export default function ContactClose() {
  return (
    <section id="contact" className="signoff">
      <div className="u-container pad-block-2xl">
        <div className="stamp-frame" data-reveal>
          <span className="stamp-badge" aria-hidden="true">
            365
          </span>

          <span className="annot">{contactSection.kicker}</span>
          <h2 className="t-display mt-6 measure-statement">
            {contactSection.heading}
          </h2>

          <div className="mt-10 grid gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-7">
              <p className="t-lead measure-wide">{contactSection.lede}</p>
              <div className="mt-8 flex flex-col gap-4">
                <span className="annot">{contactSection.emailLabel}</span>
                <a href={`mailto:${contact.email}`} className="contact-email">
                  {contact.email}
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-6 md:col-span-5 md:items-end md:justify-end">
              <a
                href={contact.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary !px-7 !py-4"
              >
                {contactSection.bookLabel}
              </a>
            </div>
          </div>

          <div className="signoff-meta mt-12">
            {contactSection.meta.map((m) => (
              <div key={m.key} className="flex flex-col gap-1.5">
                <span className="signoff-key">{m.key}</span>
                <span className="signoff-val">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
