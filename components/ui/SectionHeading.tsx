import SplitText from "@/components/ui/SplitText";

type Props = {
  index: string;
  kicker: string;
  heading: string;
  className?: string;
};

/**
 * Standard section header: stroked index numeral + mono kicker on one line,
 * masked split-word heading beneath. Server component.
 */
export default function SectionHeading({ index, kicker, heading, className }: Props) {
  return (
    <header className={className}>
      <div data-reveal className="flex items-center gap-4">
        <span className="index-num" aria-hidden="true">
          {index}
        </span>
        <span className="t-coord">{kicker}</span>
      </div>
      <h2 className="t-h2 mt-6">
        <SplitText text={heading} />
      </h2>
    </header>
  );
}
