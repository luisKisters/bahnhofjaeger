"use client";

import React from "react";
import { CollectionStats } from "@/app/lib/db";
import StatisticBar from "@/app/components/StatisticBar";

export default function StatsCard(props: { stats: CollectionStats }) {
  const { stats } = props;

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

  // Get current month name
  const getCurrentMonthName = () => {
    return new Date().toLocaleString("default", { month: "long" });
  };

  // Calculate percentage for each price class
  const renderPriceClassProgress = () => {
    // Only show price classes that have data
    const priceClasses = Object.keys(stats.priceClassStats)
      .map(Number)
      .filter((pc) => stats.priceClassStats[pc]?.total > 0)
      .sort((a, b) => a - b);

    const mainStationStats = stats.mainStationStats;

    return (
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">
          Completion Statistics
        </h3>
        <StatisticBar
          percentage={
            Math.round(
              (mainStationStats.collected / mainStationStats.total) * 1000
            ) / 10
          }
          collected={mainStationStats.collected}
          total={mainStationStats.total}
          name="Main Stations"
        />
        {priceClasses.map((pc) => {
          const { collected, total } = stats.priceClassStats[pc] || {
            collected: 0,
            total: 0,
          };
          const percentage =
            total > 0 ? Math.round((collected / total) * 1000) / 10 : 0;

          return (
            <StatisticBar
              percentage={percentage}
              collected={collected}
              total={total}
              name={`Class ${pc}`}
              key={pc}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="">
      <h2 className="text-xl mb-2 ">Punkte und Level</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col justify-center item-center text-center bg-background-secondary p-4 rounded-lg">
          <div className="text-3xl font-bold text-shadow-lg">
            {/* {stats.totalPoints} */} 1.250
          </div>
          <div className="font-medium text-sm text-shadow-lg">Sammelpunkte</div>
        </div>

        <div className="flex flex-col justify-center item-center text-center bg-background-secondary p-4 rounded-lg">
          <div className="text-3xl font-bold text-shadow-lg">
            {stats.totalStations}
          </div>
          <div className="text-sm font-medium text-shadow-lg">Stations</div>
        </div>

        <div className="flex flex-col justify-center item-center text-center bg-background-secondary p-4 rounded-lg">
          <div className="text-3xl font-bold text-shadow-lg">
            {stats.stationsThisMonth}
          </div>
          <div className="text-sm font-medium text-shadow-lg">
            {getCurrentMonthName()} Stations
          </div>
        </div>

        <div className="flex flex-col justify-center item-center text-center bg-background-secondary p-4 rounded-lg relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, var(--color-action) 0%, var(--color-action) ${Math.round(
                (stats.totalStations /
                  (Object.values(stats.priceClassStats).reduce(
                    (sum, { total }) => sum + total,
                    0
                  ) || 1)) *
                  100
              )}%, transparent ${Math.round(
                (stats.totalStations /
                  (Object.values(stats.priceClassStats).reduce(
                    (sum, { total }) => sum + total,
                    0
                  ) || 1)) *
                  100
              )}%)`,
            }}
          />
          <div className="relative">
            <div className="text-3xl font-bold text-shadow-lg">
              {Math.round(
                (stats.totalStations /
                  (Object.values(stats.priceClassStats).reduce(
                    (sum, { total }) => sum + total,
                    0
                  ) || 1)) *
                  100
              )}
              %
            </div>
            <div className="font-medium text-sm text-shadow-lg">
              Overall Completion
            </div>
          </div>
        </div>
      </div>

      {/* Price Class Statistics */}
      {/* {showPriceClassCompletion && renderPriceClassProgress()} */}

      <div className="mt-3 text-xs font-medium text-gray-600 text-right">
        Last updated: {formatDate(stats.lastUpdated)}
      </div>
    </div>
  );
}
