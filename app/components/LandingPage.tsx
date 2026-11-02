"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, CheckCircle2, Map, Trophy, Flame } from "lucide-react";
import { markOnboarded } from "@/app/lib/onboarding";

const steps = [
  {
    icon: Search,
    title: "Bahnhof suchen",
    text: "Tipp oben den Namen eines Bahnhofs ein, an dem du gerade bist oder warst.",
  },
  {
    icon: CheckCircle2,
    title: "Sammeln",
    text: "Markier ihn als gesammelt und kassier die Punkte.",
  },
  {
    icon: Map,
    title: "Auf der Karte sehen",
    text: "Alle deine Bahnhöfe auf einer Deutschlandkarte. Wo sind noch Lücken?",
  },
  {
    icon: Flame,
    title: "Streak halten",
    text: "Sammle jeden Monat mindestens einen neuen Bahnhof, damit deine Serie weiterläuft.",
  },
];

const points = [
  { label: "Hauptbahnhof", value: 100 },
  { label: "Preisklasse 1", value: 70 },
  { label: "Preisklasse 3", value: 50 },
  { label: "Preisklasse 7", value: 10 },
];

const levels = [
  { name: "Eisen", color: "#ababaf" },
  { name: "Bronze", color: "#ca7345" },
  { name: "Silber", color: "#dedede" },
  { name: "Gold", color: "#ffde45" },
  { name: "Platin", color: "#dedeff" },
  { name: "Diamant", color: "#8AD2C3" },
  { name: "Meister", color: "#B591E9" },
];

export default function LandingPage() {
  const router = useRouter();
  const onStart = () => {
    markOnboarded();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <div
        className="w-full max-w-xl mx-auto px-5 pt-14 pb-36"
        style={{ paddingTop: "max(3.5rem, env(safe-area-inset-top))" }}
      >
        {/* Hero */}
        <Image
          src="/icons/icon.svg"
          alt="Bahnhofjäger Icon"
          width={72}
          height={72}
          className="rounded-2xl mb-6"
          priority
        />
        <h1 className="text-4xl font-bold leading-tight">Bahnhofjäger</h1>
        <p className="text-lg text-secondary font-light mt-2">
          Über 5.400 Bahnhöfe in Deutschland. Wie viele schaffst du?
        </p>

        {/* Preview of the home stats */}
        <div className="grid grid-cols-2 gap-3 mt-8" aria-hidden>
          <PreviewTile value="1.240" label="Sammelpunkte" />
          <PreviewTile
            value="Bronze II"
            label="Stations"
            valueStyle={{ color: "#ca7345" }}
          />
          <PreviewTile value="4 Monate" label="Streak 🔥" />
          <PreviewTile value="37" label="Stationen" />
        </div>

        {/* How it works */}
        <h2 className="text-xl mt-12 mb-4">So funktioniert&apos;s</h2>
        <ol className="flex flex-col gap-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li
              key={title}
              className="flex gap-4 items-start bg-background-secondary rounded-[10px] p-4"
            >
              <div className="flex items-center justify-center shrink-0 w-10 h-10 rounded-full bg-background">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium">
                  <span className="text-secondary mr-1">{i + 1}.</span>
                  {title}
                </p>
                <p className="text-sm text-secondary mt-0.5">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Points */}
        <h2 className="text-xl mt-12 mb-1">Punkte</h2>
        <p className="text-sm text-secondary mb-4">
          Je größer der Bahnhof, desto mehr Punkte.
        </p>
        <div className="bg-background-secondary rounded-[10px] divide-y divide-background">
          {points.map((p) => (
            <div key={p.label} className="flex justify-between px-4 py-3">
              <span>{p.label}</span>
              <span className="font-bold">+{p.value}</span>
            </div>
          ))}
        </div>

        {/* Levels */}
        <h2 className="text-xl mt-12 mb-1 flex items-center gap-2">
          <Trophy className="w-5 h-5" /> Level
        </h2>
        <p className="text-sm text-secondary mb-4">
          Mit deinen Punkten steigst du auf, von Eisen bis Meister.
        </p>
        <div className="flex flex-wrap gap-2">
          {levels.map((l) => (
            <span
              key={l.name}
              className="px-3 py-1.5 rounded-full bg-background-secondary text-sm font-semibold"
              style={{ color: l.color }}
            >
              {l.name}
            </span>
          ))}
        </div>

        <p className="text-sm text-secondary mt-12">
          Android: Bahnhofjäger ist im geschlossenen Test im Play Store. Für
          Early Access{" "}
          <a
            href="mailto:luis.w.kisters@gmail.com"
            className="text-white underline"
          >
            schreib mir eine E-Mail
          </a>
          .
        </p>

        <p className="text-xs text-secondary mt-4">
          Deine Sammlung bleibt auf deinem Gerät gespeichert.{" "}
          <Link href="/privacy" className="underline">
            Datenschutz
          </Link>
        </p>
      </div>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="w-full max-w-xl mx-auto px-5">
          <button
            onClick={onStart}
            className="w-full py-4 rounded-lg bg-action text-white text-lg font-semibold active:scale-[0.99] transition-transform"
          >
            Los geht&apos;s
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewTile({
  value,
  label,
  valueStyle,
}: {
  value: string;
  label: string;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div className="flex flex-col items-center justify-center bg-background-secondary rounded-[10px] py-5">
      <span className="text-2xl font-bold" style={valueStyle}>
        {value}
      </span>
      <span className="text-sm font-medium mt-0.5">{label}</span>
    </div>
  );
}
