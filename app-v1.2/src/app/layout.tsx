import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { unreadCount } from "@/lib/data/chat";
import { logout } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: "Provo Contracts",
  description: "Buy, sell and sublease Provo housing contracts in one place.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export const dynamic = "force-dynamic";

const TABS = [
  { href: "/match", label: "Match", icon: "♥" },
  { href: "/map", label: "Map", icon: "◎" },
  { href: "/sell", label: "Sell", icon: "+" },
  { href: "/inbox", label: "Inbox", icon: "✉" },
  { href: "/me", label: "Me", icon: "☺" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const unread = user ? unreadCount(user.id) : 0;

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-[1000] border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
            <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">P</span>
              <span>Provo Contracts</span>
            </Link>
            <nav className="hidden gap-1 text-sm font-medium md:flex">
              {TABS.map((t) => (
                <Link key={t.href} href={t.href} className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  {t.label}
                  {t.href === "/inbox" && unread > 0 && (
                    <span className="ml-1 rounded-full bg-brand-600 px-1.5 text-xs text-white">{unread}</span>
                  )}
                </Link>
              ))}
              {user?.is_admin ? (
                <Link href="/admin" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">Admin</Link>
              ) : null}
            </nav>
            <div className="ml-auto flex items-center gap-2 text-sm">
              {user ? (
                <>
                  <span className="hidden text-slate-600 sm:inline">Hi, {user.name.split(" ")[0]}</span>
                  <form action={logout}>
                    <button className="btn-ghost !py-1.5">Log out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost !py-1.5">Log in</Link>
                  <Link href="/signup" className="btn-primary !py-1.5">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:pb-10">{children}</main>

        {/* Bottom tab bar on phones */}
        <nav className="fixed inset-x-0 bottom-0 z-[1000] grid grid-cols-5 border-t border-slate-200 bg-white md:hidden">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className="relative flex flex-col items-center py-2 text-xs text-slate-600">
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
              {t.href === "/inbox" && unread > 0 && (
                <span className="absolute right-5 top-1 rounded-full bg-brand-600 px-1.5 text-[10px] text-white">{unread}</span>
              )}
            </Link>
          ))}
        </nav>
      </body>
    </html>
  );
}
