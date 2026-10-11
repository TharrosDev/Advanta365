import type { HTMLAttributes, Ref } from "react";
import { cssVars } from "@/lib/cx";

type AppearProps = {
  as?: "div" | "p" | "span" | "ul" | "ol" | "li" | "section" | "figure";
  move?: "drift" | "ink-in" | "settle" | "grow";
  when?: "view" | "load";
  /** Position in a staggered group, from 0: each step starts a little later. */
  order?: number;
  ref?: Ref<HTMLElement>;
} & HTMLAttributes<HTMLElement>;

/**
 * A wrapper that arrives: it sets `data-move` (which entrance), `data-when="load"` (by the clock
 * at page load, where asked) and `--order` (its turn in a group), and app/motion.css does the
 * rest. The wrapper owns the entrance, so what it holds is free to turn, lift and tilt by itself.
 * `drift` is for paragraphs, leads, ledgers and controls and never for a heading; `ink-in` for
 * statement headings; `settle` for sheets, stacks and folders; `grow` for a rule. Without
 * JavaScript and under reduced motion it is an ordinary element. Every other prop goes to it.
 */
export function Appear({
  as: Tag = "div",
  move = "drift",
  when = "view",
  order,
  style,
  ref,
  ...rest
}: AppearProps) {
  return (
    <Tag
      {...rest}
      // The tag is a union, and no one ref type fits every member of it: each is an HTMLElement.
      ref={ref as Ref<never>}
      data-move={move}
      data-when={when === "load" ? "load" : undefined}
      style={order === undefined ? style : { ...style, ...cssVars({ "--order": order }) }}
    />
  );
}
