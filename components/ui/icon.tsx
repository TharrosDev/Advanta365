/** One path per icon, drawn on a 20-unit grid. */
const PATHS = {
  arrow: "M4 10H16M11 5L16 10L11 15",
  chevron: "M5 8L10 13L15 8",
  plus: "M10 4V16M4 10H16",
  minus: "M4 10H16",
  close: "M5 5L15 15M15 5L5 15",
  tick: "M4.5 10.5L8.5 14.5L15.5 6",
  bars: "M3 6H17M3 10H17M3 14H17",
  search: "M12.4 12.4L16.5 16.5M14 8.5A5.5 5.5 0 1 1 3 8.5A5.5 5.5 0 1 1 14 8.5Z",
} as const;

type IconName = keyof typeof PATHS;

/**
 * The site's line icons: a 1.75 stroke with round caps and joins in `currentColor`, always
 * decorative. `size` is the drawn width and height in pixels at the 16px root; the icon is sized in
 * rem, so on a large monitor, where the root grows (see `html` in globals.css), it grows with the
 * words and the controls it stands beside. `flip` mirrors the icon left to right (the arrow of
 * "Previous"). The icon never shrinks inside a flex row.
 */
export function Icon({
  name,
  size = 20,
  flip = false,
  className,
}: {
  name: IconName;
  size?: number;
  flip?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none", width: `${size / 16}rem`, height: `${size / 16}rem` }}
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} transform={flip ? "translate(20 0) scale(-1 1)" : undefined} />
    </svg>
  );
}
