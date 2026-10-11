"use client";

import { useSyncExternalStore } from "react";

// The address is read once per render. Nothing here ever changes it: a navigation renders a new page.
function subscribe() {
  return () => {};
}

function getPath() {
  return window.location.pathname + window.location.search;
}

// Server HTML and the hydration render both show nothing, so the first client render matches it.
function getServerPath() {
  return "";
}

/** The address that was asked for, shown beside the "Error 404" label. Empty until hydrated. */
export function RequestedPath() {
  const path = useSyncExternalStore(subscribe, getPath, getServerPath);
  return <span className="t-label-medium c-fg-50">{path}</span>;
}
