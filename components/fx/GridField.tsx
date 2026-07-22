"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";

/**
 * The hero field: a raw 2D-canvas particle lattice that opens scattered and
 * settles into a governed grid — sprawl coming under an operating model, the
 * product's argument as a visual. A slow cobalt scan line sweeps the settled
 * grid; the pointer scatters nearby points and they return to their cells.
 *
 * Robustness rules: never mounts for reduced-motion visitors (the CSS
 * drafting grid + bloom stay), pauses off-screen and on hidden tabs, caps
 * DPR, and rebuilds on resize.
 */

type Point = {
  hx: number; // home (grid) position
  hy: number;
  sx: number; // scatter origin
  sy: number;
  ox: number; // pointer offset (decays)
  oy: number;
  phase: number;
  drift: number;
};

const INK = "56, 50, 43"; // ≈ oklch(0.25 0.016 64), the site's ink
const COBALT = "59, 85, 255"; // deep cobalt reads on the paper ground

export default function GridField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (prefersReducedMotion()) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const lowPower =
      (navigator.hardwareConcurrency ?? 8) <= 4 ||
      ((navigator as { deviceMemory?: number }).deviceMemory ?? 8) <= 4;

    let points: Point[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = false;
    let inView = true;
    const startTime = performance.now();
    const pointer = { x: -9999, y: -9999 };

    const build = () => {
      // Read DPR per build: it changes when the window moves between
      // monitors, and the ResizeObserver re-runs build for us then.
      const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const spacing =
        Math.max(34, Math.min(52, width / 34)) * (lowPower ? 1.35 : 1);
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      points = [];
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const hx = c * spacing; // square lattice
          const hy = r * spacing;
          points.push({
            hx,
            hy,
            sx: hx + (Math.random() - 0.5) * width * 0.55,
            sy: hy + (Math.random() - 0.5) * height * 0.55,
            ox: 0,
            oy: 0,
            phase: Math.random() * Math.PI * 2,
            drift: 0.6 + Math.random() * 0.8,
          });
        }
      }
    };

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const draw = () => {
      raf = 0;
      if (!running) return;
      const t = (performance.now() - startTime) / 1000;
      // Global order: 0 → 1 over ~3.2s, the settle moment of the site.
      const order = easeOut(Math.min(1, t / 3.2));
      const chaos = 1 - order;

      ctx.clearRect(0, 0, width, height);

      // Cobalt scan line sweeps once the grid is mostly governed.
      const scanX = ((t * 0.055) % 1.3) * width * 1.3 - width * 0.15;
      const scanStrength = order > 0.85 ? 1 : 0;

      for (const p of points) {
        // Scatter origin drifts slowly so the opening feels alive.
        const dx = Math.sin(t * 0.4 * p.drift + p.phase) * 26 * chaos;
        const dy = Math.cos(t * 0.33 * p.drift + p.phase * 1.7) * 22 * chaos;
        // Settled breathing: barely-there, the grid is *governed*.
        const bx = Math.sin(t * 0.7 + p.phase) * 1.2 * order;
        const by = Math.cos(t * 0.6 + p.phase * 1.3) * 1.2 * order;

        let x = p.sx + (p.hx - p.sx) * order + dx + bx;
        let y = p.sy + (p.hy - p.sy) * order + dy + by;

        // Pointer repulsion with spring-back.
        const px = x - pointer.x;
        const py = y - pointer.y;
        const d2 = px * px + py * py;
        if (d2 < 110 * 110 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = ((110 - d) / 110) * 30;
          p.ox += (px / d) * f * 0.12;
          p.oy += (py / d) * f * 0.12;
        }
        p.ox *= 0.86;
        p.oy *= 0.86;
        x += p.ox;
        y += p.oy;

        // Scan-line glow.
        const sd = Math.abs(x - scanX);
        const glow = scanStrength * Math.max(0, 1 - sd / 130);

        const alpha = 0.13 + 0.19 * order + glow * 0.5;
        const size = 1.6 + glow * 1.2;
        ctx.fillStyle =
          glow > 0.08 ? `rgba(${COBALT}, ${alpha})` : `rgba(${INK}, ${alpha})`;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }

      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running || !inView || document.hidden) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    build();
    start();

    // Track the pointer at window level: the hero content and HUD layers sit
    // above the canvas, so events rarely reach the canvas itself. The rect is
    // cached and refreshed on scroll/resize instead of read per event.
    let rect = canvas.getBoundingClientRect();
    const refreshRect = () => {
      rect = canvas.getBoundingClientRect();
    };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", refreshRect, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(() => {
      build();
      refreshRect();
    });
    // device-pixel-content-box also fires on DPR changes (window dragged to
    // another monitor); Safari doesn't support it, so fall back to css-box.
    try {
      ro.observe(canvas, { box: "device-pixel-content-box" });
    } catch {
      ro.observe(canvas);
    }

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", refreshRect);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}
