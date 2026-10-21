import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { MARK_HUE_D, MARK_INK_D, MARK_VIEWBOX } from "@/lib/brand/mark";
import { SITE, TOOLKIT } from "@/lib/site";
import { SITE_ORIGIN } from "./origin";

/**
 * The card a shared link shows (Open Graph and X), drawn at build time by `next/og`: a sheet of the
 * site's paper with the mark and the name at the head, a label, a headline in the documents' face,
 * a line under it, and the toolkit's counts at the foot over the highlighter's edge.
 *
 * The colours are read from the tokens in `app/globals.css`, the one place raw colour is written,
 * and the faces are the site's own two, fetched from Google Fonts while the card is drawn. If they
 * cannot be fetched (a build without the network) the card is drawn in the renderer's own face
 * rather than not at all.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

let tokens: Map<string, string> | undefined;

/** A colour token of the site, by its name without the dashes: `token("ink")`. */
function token(name: string): string {
  if (!tokens) {
    const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    tokens = new Map(
      [...css.matchAll(/--([a-z-]+):\s*([^;]+);/g)].map((match) => [match[1]!, match[2]!.trim()]),
    );
  }
  const value = tokens.get(name);
  if (!value) throw new Error(`no --${name} token in app/globals.css`);
  return value;
}

type Font = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: "normal" };

/** One weight of a Google font as TrueType, or nothing when it cannot be had. */
async function googleFont(family: string, weight: Font["weight"]): Promise<Font | undefined> {
  try {
    const query = `${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${weight}`;
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${query}`).then((response) =>
      response.ok ? response.text() : "",
    );
    const url = /src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/.exec(css)?.[1];
    if (!url) return undefined;
    const data = await fetch(url).then((response) => (response.ok ? response.arrayBuffer() : null));
    return data ? { name: family, data, weight, style: "normal" } : undefined;
  } catch {
    return undefined;
  }
}

let fonts: Promise<Font[]> | undefined;

/** The faces of the cards, fetched once per build. */
function loadFonts(): Promise<Font[]> {
  fonts ??= Promise.all([
    googleFont("Besley", 600),
    googleFont("Atkinson Hyperlegible Next", 400),
    googleFont("Atkinson Hyperlegible Next", 700),
  ]).then((list) => list.filter((font): font is Font => font !== undefined));
  return fonts;
}

const DOCUMENT = "Besley";
const STORE = "Atkinson Hyperlegible Next";

/** The mark on its ink tile, as the icon draws it. */
function Tile({ size }: { size: number }) {
  const scale = (size * 0.84) / MARK_VIEWBOX.width;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size * (7 / 32),
        background: token("ink"),
      }}
    >
      <svg
        width={MARK_VIEWBOX.width * scale}
        height={MARK_VIEWBOX.height * scale}
        viewBox={`0 0 ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`}
      >
        <path d={MARK_HUE_D} fill={token("mark")} />
        <path d={MARK_INK_D} fill={token("on-ink")} />
      </svg>
    </div>
  );
}

/**
 * A stack of three sheets of the toolkit's paper, the front one a template with its title lines, a
 * highlighter stroke and the three file types it comes in. It pictures the product on every card
 * that has no figure of its own, so a shared link shows something to open, not only words.
 */
function Stack() {
  const sheet = (rotate: number, x: number, y: number, front = false) => ({
    display: "flex",
    flexDirection: "column" as const,
    position: "absolute" as const,
    left: x,
    top: y,
    width: 292,
    height: 372,
    padding: 28,
    background: token("paper"),
    border: `2px solid ${front ? token("ink") : token("rule")}`,
    borderRadius: 10,
    transform: `rotate(${rotate}deg)`,
    boxShadow: front ? `10px 12px 0 ${token("rule")}` : "none",
  });
  const bar = (width: number, color: string, height = 14) => ({
    display: "flex",
    width,
    height,
    marginTop: 14,
    background: color,
    borderRadius: 3,
  });
  return (
    <div style={{ display: "flex", position: "relative", width: 360, height: 400 }}>
      <div style={sheet(-9, 4, 14)} />
      <div style={sheet(5, 34, 6)} />
      <div style={sheet(-1.5, 22, 18, true)}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Tile size={34} />
          <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: token("ink-faint") }}>
            Template
          </div>
        </div>
        <div style={bar(220, token("ink"), 22)} />
        <div style={bar(170, token("ink"), 22)} />
        <div style={{ ...bar(120, token("mark"), 16), marginTop: 20 }} />
        <div style={bar(228, token("rule"), 10)} />
        <div style={bar(212, token("rule"), 10)} />
        <div style={bar(228, token("rule"), 10)} />
        <div style={bar(150, token("rule"), 10)} />
        <div style={{ display: "flex", flexGrow: 1 }} />
        <div style={{ display: "flex", gap: 8 }}>
          {["DOCX", "PPTX", "XLSX"].map((type) => (
            <div
              key={type}
              style={{
                display: "flex",
                fontSize: 16,
                fontWeight: 700,
                padding: "3px 10px",
                background: token("mark-wash"),
                color: token("ink-soft"),
                borderRadius: 4,
              }}
            >
              {type}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** One of the toolkit's counts, the figure large over its name. */
function Stat({ value, name }: { value: number; name: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: token("ink") }}>
        {value}
      </div>
      <div style={{ display: "flex", fontSize: 22 }}>{name}</div>
    </div>
  );
}

export type OgCardInput = {
  /** The small label over the headline. */
  label: string;
  /** The headline, in the documents' face. */
  title: string;
  /** One or two sentences under it. */
  body?: string;
  /** A figure set large at the right: a phase's number, a price. */
  aside?: string;
  /** A line under the figure. */
  asideNote?: string;
};

/** The card, as the image a route's `opengraph-image` file returns. */
export async function ogCard({ label, title, body, aside, asideNote }: OgCardInput) {
  const titleSize = title.length > 48 ? 60 : title.length > 30 ? (aside ? 72 : 64) : aside ? 84 : 76;
  const host = new URL(SITE_ORIGIN).host;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: token("paper"),
        color: token("ink"),
        fontFamily: STORE,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          padding: "48px 72px 32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Tile size={64} />
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>{SITE.name}</div>
          <div style={{ display: "flex", fontSize: 24, color: token("ink-faint") }}>
            {`a product of ${SITE.parent}`}
          </div>
        </div>

        <div style={{ display: "flex", flexGrow: 1, alignItems: "center", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, flexBasis: 0 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                fontSize: 24,
                fontWeight: 700,
                padding: "4px 12px",
                background: token("mark-wash"),
                color: token("ink-soft"),
              }}
            >
              {label}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontFamily: DOCUMENT,
                fontWeight: 600,
                fontSize: titleSize,
                lineHeight: 1.08,
              }}
            >
              {title}
            </div>
            {body ? (
              <div
                style={{
                  display: "flex",
                  marginTop: 24,
                  fontSize: 28,
                  lineHeight: 1.35,
                  color: token("ink-soft"),
                }}
              >
                {body}
              </div>
            ) : null}
          </div>
          {aside ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div
                style={{
                  display: "flex",
                  fontFamily: DOCUMENT,
                  fontWeight: 600,
                  fontSize: aside.length > 3 ? 64 : 200,
                  lineHeight: 1,
                }}
              >
                {aside}
              </div>
              {asideNote ? (
                <div
                  style={{
                    display: "flex",
                    marginTop: 12,
                    fontSize: 26,
                    color: token("ink-faint"),
                  }}
                >
                  {asideNote}
                </div>
              ) : null}
            </div>
          ) : (
            <div style={{ display: "flex", width: 300, height: 330 }}>
              <div
                style={{
                  display: "flex",
                  transform: "scale(0.8)",
                  transformOrigin: "top left",
                }}
              >
                <Stack />
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 20,
            borderTop: `2px solid ${token("rule")}`,
            fontSize: 22,
            color: token("ink-faint"),
          }}
        >
          <div style={{ display: "flex", gap: 36 }}>
            <Stat value={TOOLKIT.playbooks} name="playbooks" />
            <Stat value={TOOLKIT.templates} name="templates" />
            <Stat value={TOOLKIT.fieldGuides} name="field guides" />
            <Stat value={TOOLKIT.jobAids} name="job aids" />
          </div>
          <div style={{ display: "flex", fontWeight: 700, color: token("ink") }}>{host}</div>
        </div>
      </div>
      <div style={{ display: "flex", height: 14, background: token("mark") }} />
    </div>,
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}
