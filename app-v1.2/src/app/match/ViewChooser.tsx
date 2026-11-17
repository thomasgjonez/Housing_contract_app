"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const COOKIE = "matchView";
const YEAR = 60 * 60 * 24 * 365;

function save(view: "swipe" | "grid") {
  document.cookie = `${COOKIE}=${view}; path=/; max-age=${YEAR}; samesite=lax`;
}

/**
 * First visit to Match: phones get swipe, laptops get the grid. The choice is
 * saved in a cookie and the page reloads with it.
 */
export function PickDefaultView() {
  const router = useRouter();
  useEffect(() => {
    save(window.matchMedia("(min-width: 768px)").matches ? "grid" : "swipe");
    router.refresh();
  }, [router]);
  return <div className="py-20 text-center text-sm text-slate-500">Loading matches…</div>;
}

/** Remembers the view the buyer toggled to. */
export function RememberView({ view }: { view: "swipe" | "grid" }) {
  useEffect(() => save(view), [view]);
  return null;
}
