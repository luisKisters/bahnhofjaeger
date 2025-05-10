"use client";

import React from "react";
import Link from "next/link";
import InitializationScreen from "@/app/components/InitializationScreen";
import StatsCard from "@/app/components/StatsCard";
import StationProgressBars from "@/app/components/StationProgressBars";
import { useCollection } from "@/app/lib/useCollection";

export default function HomePage() {
  const { stats, isLoading } = useCollection();

  return (
    <InitializationScreen>
      <div className="p-4 pb-32 mt-20">
        <h1 className="text-3xl font-bold">Bahnhofjäger</h1>
        <p className="text-lg text-secondary mb-8 font-light">
          Sammle Bahnhöfe und erhalte Punkte!
        </p>

        {/* Collection Stats */}
        {!isLoading && <StatsCard stats={stats} />}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center my-8">
            <div className="w-8 h-8 border-4 border-secondary border-t-action rounded-full animate-spin"></div>
          </div>
        )}

        <h2 className="text-xl mb-2 mt-8">Fortschritt</h2>

        {/* Progress bars for station classes */}
        {!isLoading && <StationProgressBars stats={stats} />}

        {/* Privacy Policy link */}
        <div className="text-xs text-gray-400 text-center mt-8">
          <Link href="/privacy" className="underline hover:text-blue-600">
            Privacy Policy
          </Link>
        </div>
      </div>
    </InitializationScreen>
  );
}
