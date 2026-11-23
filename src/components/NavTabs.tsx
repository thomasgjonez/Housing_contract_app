"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChat, IconHeart, IconMap, IconPlus, IconUser } from "./Icons";
import { useUnread } from "./ChatLive";

const TABS = [
  { href: "/match", label: "Match", Icon: IconHeart },
  { href: "/map", label: "Map", Icon: IconMap },
  { href: "/sell", label: "Sell", Icon: IconPlus },
  { href: "/inbox", label: "Inbox", Icon: IconChat },
  { href: "/me", label: "Me", Icon: IconUser },
];

function useActive() {
  const path = usePathname();
  return (href: string) => path === href || path.startsWith(href + "/");
}

function Unread({ n, className }: { n: number; className: string }) {
  if (n <= 0) return null;
  return <span className={`rounded-full bg-sunset-500 px-1.5 text-[10px] font-bold leading-4 text-white ${className}`}>{n}</span>;
}

/** Pill nav in the header on laptops. */
export function TopTabs({ isAdmin }: { isAdmin: boolean }) {
  const active = useActive();
  const unread = useUnread();
  const tabs = isAdmin ? [...TABS, { href: "/admin", label: "Admin", Icon: IconUser }] : TABS;
  return (
    <nav className="hidden items-center gap-1 rounded-full bg-white/80 p-1 text-sm font-medium shadow-soft backdrop-blur md:flex">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={active(t.href) ? "page" : undefined}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 transition ${active(t.href) ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-brand-50 hover:text-brand-600"}`}
        >
          {t.label}
          {t.href === "/inbox" && <Unread n={unread} className="" />}
        </Link>
      ))}
    </nav>
  );
}

/** Floating pill tab bar on phones. */
export function BottomTabs() {
  const active = useActive();
  const unread = useUnread();
  return (
    <nav
      className="fixed inset-x-3 z-[1000] grid grid-cols-5 gap-1 rounded-full bg-brand-600 p-1.5 shadow-lift md:hidden"
      style={{ bottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
    >
      {TABS.map(({ href, label, Icon }) => {
        const on = active(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`relative flex flex-col items-center gap-0.5 rounded-full py-2 text-[11px] font-medium transition ${on ? "bg-ground text-brand-600" : "text-brand-100"}`}
          >
            <Icon className="h-5 w-5" />
            {label}
            {href === "/inbox" && <Unread n={unread} className="absolute right-3 top-1" />}
          </Link>
        );
      })}
    </nav>
  );
}
