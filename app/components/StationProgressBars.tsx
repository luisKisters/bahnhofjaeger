"use client";

import React, { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CollectionStats } from "@/app/lib/db";

export default function StationProgressBars({
  stats,
}: {
  stats: CollectionStats;
}) {
  const [expanded, setExpanded] = useState(false);

  // Calculate overall progress
  const totalCollected = stats.totalStations || 0;
  const totalStations = Object.values(stats.priceClassStats || {}).reduce(
    (sum, curr) => sum + (curr.total || 0),
    0
  );
  const overallPercentage = totalStations
    ? Math.round((totalCollected / totalStations) * 100)
    : 0;

  // Create station classes array from stats data
  const stationClasses = [
    {
      name: "Gesamtfortschritt",
      collected: totalCollected,
      total: totalStations,
      percentage: overallPercentage,
    },
    {
      name: "Hauptbahnhöfe",
      collected: stats.mainStationStats?.collected || 0,
      total: stats.mainStationStats?.total || 0,
      percentage: stats.mainStationStats?.total
        ? Math.round(
            (stats.mainStationStats.collected / stats.mainStationStats.total) *
              100
          )
        : 0,
    },
  ];

  // Add price classes from stats
  for (let i = 1; i <= 7; i++) {
    const priceClass = stats.priceClassStats?.[i] || { collected: 0, total: 0 };
    stationClasses.push({
      name: `Preisklasse ${i}`,
      collected: priceClass.collected || 0,
      total: priceClass.total || 0,
      percentage: priceClass.total
        ? Math.round((priceClass.collected / priceClass.total) * 100)
        : 0,
    });
  }

  // Show Gesamtfortschritt and first two entries when collapsed, show all when expanded
  const visibleStations = expanded
    ? stationClasses
    : stationClasses.filter((_, index) => index < 3);

  return (
    <div className="w-full text-white rounded-lg">
      <div className="space-y-4">
        {visibleStations.map((station) => (
          <div key={station.name} className="space-y-1">
            <div
              className="flex justify-between text-sm font-medium"
              style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.5)" }}
            >
              <span>{station.name}</span>
              <span className="text-right">
                {station.percentage}% ({station.collected}/{station.total})
              </span>
            </div>
            <div
              className="relative h-6 overflow-hidden bg-background border border-background-secondary"
              style={{ borderRadius: "5px" }}
            >
              <div
                className={`absolute left-0 top-0 h-full ${
                  station.name === "Gesamtfortschritt"
                    ? "bg-green-500"
                    : "bg-action"
                } text-white`}
                style={{
                  width: `${Math.max(station.percentage, 1)}%`,
                  borderRadius: "5px",
                }}
              >
                <span
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium"
                  style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.7)" }}
                >
                  {station.percentage > 0 ? `${station.percentage}%` : ""}
                </span>
              </div>
              {station.percentage === 0 && (
                <span
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white"
                  style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.7)" }}
                >
                  0%
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Gradient overlay and expand button */}
        <div className="relative mt-2">
          {!expanded && stationClasses.length > 3 && (
            <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent"></div>
            // <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
          )}
          <Button
            variant="secondary"
            className="w-full justify-center py-1 text-sm bg-background-secondary hover:bg-background-secondary/80"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <span>Weniger anzeigen</span>
                <ChevronUp className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                <span>Preisklassen anzeigen</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
