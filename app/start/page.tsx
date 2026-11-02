import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Train, Trophy, Map, WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Bahnhofjäger – Sammle Bahnhöfe",
  description: "Sammle Bahnhöfe und erhalte Punkte!",
};

const features = [
  { icon: Train, title: "Bahnhöfe sammeln", text: "Über 5.400 DB-Bahnhöfe in ganz Deutschland." },
  { icon: Trophy, title: "Punkte nach Preisklasse", text: "Je kleiner der Bahnhof, desto mehr Punkte." },
  { icon: Map, title: "Karte", text: "Sieh, welche Bahnhöfe dir noch fehlen." },
  { icon: WifiOff, title: "Funktioniert offline", text: "Alles bleibt auf deinem Gerät, ohne Konto." },
];

export default function StartPage() {
  return (
    <div className="min-h-screen bg-background text-white">
      <div className="mx-auto max-w-lg px-5 py-12 md:py-20">
        <div>
          <Image src="/icons/icon.svg" alt="Bahnhofjäger Icon" width={72} height={72} className="rounded-2xl" priority />
          <h1 className="mt-6 text-4xl font-bold md:text-5xl">Bahnhofjäger</h1>
          <p className="mt-3 text-lg text-secondary">Sammle Bahnhöfe und erhalte Punkte!</p>

          <ul className="mt-8 space-y-3">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 rounded-xl bg-background-element p-4">
                <Icon className="h-6 w-6 shrink-0 text-action" />
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-secondary">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link href="/" className="mt-8 block rounded-xl bg-action py-4 text-center text-lg font-semibold hover:opacity-90">
            App öffnen
          </Link>
          <p className="mt-4 text-sm text-secondary">
            Android: Bahnhofjäger ist im geschlossenen Test im Play Store. Für
            Early Access{" "}
            <a href="mailto:luis.w.kisters@gmail.com" className="text-white underline">
              schreib mir eine E-Mail
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
