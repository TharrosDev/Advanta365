import { INTRO_SCRIPT } from "./intro-script";

/**
 * The inline script that decides, before anything is painted, whether this page load opens under
 * the cover (see `intro-script.ts`). The root layout renders it first thing in `<body>`: there it
 * runs on every page, which is how a session that starts on an inner page is counted, and a change
 * of page never renders it again. It writes `data-intro` on `<html>`, which therefore carries
 * `suppressHydrationWarning`.
 *
 * It is printed as the HTML of a hidden wrapper, not as a script element of React's own. In the
 * HTML the server sends the two are the same thing: a script the parser runs where it stands. They
 * differ on a document React has to build in the browser, which is how a 404 answered at request
 * time arrives. A script element made there cannot run, and React logs an error to say so; HTML set
 * on a wrapper is inert and silent. Nothing is lost: a page that is not found is not the home page.
 */
export function IntroScript() {
  return <div hidden dangerouslySetInnerHTML={{ __html: `<script>${INTRO_SCRIPT}</script>` }} />;
}
