"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchInput from "@/app/components/SearchInput";
import { Navigation } from "@/app/components/Navigation";

// Pages that render without the app chrome (search bar, bottom nav).
const BARE_ROUTES = ["/start"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (BARE_ROUTES.includes(pathname)) return <>{children}</>;

  return (
    <div className="md:flex md:h-screen md:items-center md:justify-center md:gap-16 bg-background">
      <aside className="hidden lg:flex flex-col max-w-xs gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon.svg" alt="" className="h-16 w-16 rounded-2xl" />
        <h1 className="text-3xl font-bold text-white">Bahnhofjäger</h1>
        <p className="text-secondary">
          Bahnhofjäger ist fürs Handy gemacht. Öffne{" "}
          <span className="text-white">bahnhofjaeger.vercel.app</span> auf deinem
          Smartphone und installiere die App.
        </p>
        <Link href="/start" className="text-action hover:underline">
          Mehr erfahren →
        </Link>
      </aside>
      {/* On md+ the app lives in a phone-width column. The transform makes
          position:fixed children (nav, bottom sheet) relative to this column. */}
      <div
        className="flex flex-col min-h-screen bg-background md:min-h-0 md:h-screen md:w-[430px] md:overflow-y-auto md:[transform:translateZ(0)] md:border-x md:border-white/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <SearchInput search={true} />
        <main className="flex-1 w-full h-full relative">{children}</main>
        <Navigation />
      </div>
    </div>
  );
}
