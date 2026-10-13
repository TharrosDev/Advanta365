import { BOOT_SCRIPT } from "@/lib/boot/boot-script";

/**
 * The inline boot script (see `lib/boot/boot-script.ts`): it decides, before anything is painted,
 * whether motion is on and whether this page load opens under the cover. The
 * root layout renders it first thing in `<body>`: there it runs on every page, which is how a
 * session that starts on an inner page is counted, and a change of page never renders it again. It
 * writes attributes on `<html>`, which therefore carries `suppressHydrationWarning`.
 *
 * It is printed as the HTML of a hidden wrapper, not as a script element of React's own. In the
 * HTML the server sends the two are the same thing: a script the parser runs where it stands. They
 * differ on a document React has to build in the browser, which is how a 404 answered at request
 * time arrives. A script element made there cannot run, and React logs an error to say so; HTML set
 * on a wrapper is inert and silent.
 */
export function IntroScript() {
  return <div hidden dangerouslySetInnerHTML={{ __html: `<script>${BOOT_SCRIPT}</script>` }} />;
}
