"use client";

import React from "react";
import { CollectionStats } from "@/app/lib/db";

interface StatsCardProps {
  stats: CollectionStats;
}

export default function StatsCard({ stats }: StatsCardProps) {
  // Format the last updated date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Never";

    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Collection Stats
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm text-blue-700">Total Points</div>
          <div className="text-2xl font-bold text-blue-800">
            {stats.totalPoints}
          </div>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-sm text-green-700">Stations</div>
          <div className="text-2xl font-bold text-green-800">
            {stats.totalStations}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 text-right">
        Last updated: {formatDate(stats.lastUpdated)}
      </div>
    </div>
  );
}
