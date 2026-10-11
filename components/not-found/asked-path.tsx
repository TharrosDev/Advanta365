"use client";

import { useSyncExternalStore } from "react";
import { cx } from "@/lib/cx";
import styles from "./missing-page.module.css";

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

/**
 * The requested address, printed small above the title of the 404 page. It is empty until
 * hydrated and keeps the height of one line meanwhile, so nothing below it moves.
 */
export function AskedPath() {
  const path = useSyncExternalStore(subscribe, getPath, getServerPath);
  return <p className={cx("type-note", styles.path)}>{path}</p>;
}
