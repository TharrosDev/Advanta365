/**
 * How long a client-side navigation may take to show its URL. The route is fetched from a server
 * that, in the first seconds of a run, is also answering every other worker's first request. A quiet
 * machine needs well under a second; the headroom keeps a CPU-starved run from failing on the clock
 * instead of on the page.
 */
export const NAVIGATION_TIMEOUT = 15_000;
