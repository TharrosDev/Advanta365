import { contact, contactSection } from "@/lib/content";

/**
 * The cobalt-drenched close — the family's signature conversion moment,
 * inherited from the Echofive parent site. Server component.
 */
export default function ContactClose() {
  return (
    <section id="contact" className="drench">
      <div className="u-container pad-block-2xl">
        <div data-reveal className="flex items-center gap-4">
          <span className="index-num" aria-hidden="true">
            {contactSection.index}
          </span>
          <span className="t-coord">{contactSection.kicker}</span>
        </div>

        <h2 data-reveal className="t-display mt-8 measure-statement">
          {contactSection.heading}
        </h2>

        <div className="mt-10 grid gap-10 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-7">
            <p data-reveal className="t-lead measure-wide">
              {contactSection.lede}
            </p>
            <div data-reveal className="mt-8 flex flex-col gap-5">
              <span className="t-coord">{contactSection.emailLabel}</span>
              <a href={`mailto:${contact.email}`} className="contact-email">
                {contact.email}
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-6 md:col-span-5 md:items-end md:justify-end">
            <a
              data-reveal
              href={contact.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-invert"
            >
              {contactSection.bookLabel}
            </a>
          </div>
        </div>

        <div data-reveal className="drench-meta mt-14">
          {contactSection.meta.map((m) => (
            <div key={m.key} className="flex flex-col gap-1.5">
              <span className="drench-meta-key">{m.key}</span>
              <span className="drench-meta-val">{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
