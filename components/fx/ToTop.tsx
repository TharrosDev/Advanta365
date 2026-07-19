"use client";

import { useSmoothScroll } from "@/components/providers/SmoothScroll";

/** Round back-to-top control for the footer. */
export default function ToTop() {
  const { scrollTo } = useSmoothScroll();
  return (
    <button
      type="button"
      className="footer-top-btn"
      onClick={() => scrollTo(0)}
      aria-label="Back to top"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M8 13V3M3.5 7.5 8 3l4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
