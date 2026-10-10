import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layout/not-found-content";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return <NotFoundContent />;
}
