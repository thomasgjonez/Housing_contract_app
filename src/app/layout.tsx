import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { unreadCount } from "@/lib/data/chat";
import { logout } from "@/lib/actions/auth";
import { Ridge } from "@/components/Ridge";
import { BottomTabs, TopTabs } from "@/components/NavTabs";
import { ChatLiveProvider } from "@/components/ChatLive";

export const metadata: Metadata = {
  title: "Provo Contracts",
  description: "Buy, sell and sublease Provo housing contracts in one place.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#24483e" };

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const unread = user ? await unreadCount(user.id) : 0;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Sora:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="relative min-h-screen antialiased">
        <Ridge />
        <ChatLiveProvider initialUnread={unread} enabled={!!user}>
          <header className="relative z-[1000]">
            <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 pt-2">
              <Link href="/" className="font-display text-lg font-bold text-brand-600">
                provo<span className="text-sunset-500">.</span>contracts
              </Link>
              <div className="mx-auto">
                <TopTabs isAdmin={!!user?.is_admin} />
              </div>
              <div className="flex items-center gap-2 text-sm">
                {user ? (
                  <>
                    <Link href="/me" aria-label="Your account" className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-xs font-bold text-ground">
                      {initials(user.name)}
                    </Link>
                    <form action={logout} className="hidden sm:block">
                      <button className="btn-ghost !px-4 !py-1.5">Log out</button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="btn-ghost !px-4 !py-1.5">Log in</Link>
                    <Link href="/signup" className="btn-primary !px-4 !py-1.5">Sign up</Link>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="relative z-10 mx-auto max-w-6xl px-4 pb-32 pt-2 md:pb-12 md:pt-6">{children}</main>

          <BottomTabs />
        </ChatLiveProvider>
      </body>
    </html>
  );
}
