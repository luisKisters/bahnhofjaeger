"use client";

import React from "react";
import { CollectionStats } from "@/app/lib/db";
import StatisticBar from "@/app/components/StatisticBar";

interface StatsCardProps {
  stats: CollectionStats;
  showPriceClassCompletion?: boolean;
  className?: string;
}

export default function StatsCard({
  stats,
  showPriceClassCompletion = true,
  className = "",
}: StatsCardProps) {
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
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Collection Stats
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-blue-800">Total Points</div>
          <div className="text-2xl font-bold text-blue-900">
            {stats.totalPoints}
          </div>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-green-800">Stations</div>
          <div className="text-2xl font-bold text-green-900">
            {stats.totalStations}
          </div>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-purple-800">
            {getCurrentMonthName()} Stations
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {stats.stationsThisMonth}
          </div>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-yellow-800">
            Overall Completion
          </div>
          <div className="text-2xl font-bold text-yellow-900">
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
        </div>
      </div>

      {/* Price Class Statistics */}
      {showPriceClassCompletion && renderPriceClassProgress()}

      <div className="mt-3 text-xs font-medium text-gray-600 text-right">
        Last updated: {formatDate(stats.lastUpdated)}
      </div>
    </div>
  );
}
