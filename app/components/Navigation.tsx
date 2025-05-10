"use client";

import { Home, Map, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center w-full py-1 ${
        active ? "white-action" : "text-secondary"
        // active ? "text-action" : "text-secondary"
      }`}
    >
      {children}
    </Link>
  );
}

export const Navigation = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-secondary shadow-[0_-2px_8px_rgba(0,0,0,0.2)] z-40">
      <div className="flex justify-around items-center h-16">
        <NavLink href="/" active={pathname === "/"}>
          <Home className="h-6 w-6" />
          <span>Home</span>
        </NavLink>

        <NavLink href="/karte" active={pathname === "/karte"}>
          <Map className="h-6 w-6" />
          <span>Karte</span>
        </NavLink>

        <NavLink href="/rangliste" active={pathname === "/rangliste"}>
          <Trophy />
          <span>Rangliste</span>
        </NavLink>
      </div>
    </nav>
  );
};
