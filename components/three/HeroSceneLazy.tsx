"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import HeroFallback from "./HeroFallback";

// The three.js scene is the only place `three` is imported. Loading it through a
// dynamic({ ssr:false }) boundary keeps the ~600KB chunk out of the server graph
// and off the initial bundle — it ships only when this component actually renders
// (desktop + motion-OK). The static SVG shows while the chunk streams in.
const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <HeroFallback />,
});

// If WebGL context creation fails (old/locked-down browsers), degrade silently to
// the static SVG instead of crashing the page.
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <HeroFallback /> : this.props.children;
  }
}

export default function HeroSceneLazy() {
  return (
    <SceneBoundary>
      <HeroScene />
    </SceneBoundary>
  );
}
