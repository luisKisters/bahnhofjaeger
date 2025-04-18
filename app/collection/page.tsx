"use client";

import React, { useState } from "react";
import Layout from "@/app/components/Layout";
import StatsCard from "@/app/components/StatsCard";
import StationCard from "@/app/components/StationCard";
import { useCollection } from "@/app/lib/useCollection";
import dynamic from "next/dynamic";

// Filter options
type SortOption = "newest" | "oldest" | "points-high" | "points-low" | "name";

// Dynamically import the map component with no SSR to avoid MapTiler/map issues
const DynamicStationMap = dynamic(() => import("@/app/components/StationMap"), {
  ssr: false,
  loading: () => (
    <div
      className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-center items-center"
      style={{ height: "400px" }}
    >
      <p className="text-gray-600">Loading map...</p>
    </div>
  ),
});

export default function CollectionPage() {
  const { isLoading, entries, stats, error, removeStation } = useCollection();
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Handle removing a station
  const handleRemoveStation = async (stationId: string) => {
    const success = await removeStation(stationId);
    if (success) {
      // Collection will be automatically refreshed via the hook
    }
  };

  // Sort the collection based on the selected option
  const sortedEntries = [...entries].sort((a, b) => {
    switch (sortOption) {
      case "newest":
        return b.timestamp - a.timestamp;
      case "oldest":
        return a.timestamp - b.timestamp;
      case "points-high":
        return b.station.pointValue - a.station.pointValue;
      case "points-low":
        return a.station.pointValue - b.station.pointValue;
      case "name":
        return a.station.name.localeCompare(b.station.name);
      default:
        return 0;
    }
  });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          My Station Collection
        </h1>

        {/* Loading state */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <p className="text-center text-gray-600">
              Loading your collection...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4 text-red-500">
            <p>Error loading collection: {error.message || "Unknown error"}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && entries.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4 text-center">
            <p className="text-gray-600 mb-2">
              Your collection is empty. Start collecting stations!
            </p>
            <p className="text-sm text-gray-500">
              Search for stations and add them to your collection.
            </p>
          </div>
        )}

        {/* Stats */}
        {!isLoading && entries.length > 0 && (
          <StatsCard stats={stats} className="mb-4" />
        )}

        {/* Controls */}
        {!isLoading && entries.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              {/* View toggle */}
              <div className="flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  List
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                    viewMode === "map"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setViewMode("map")}
                >
                  Map
                </button>
              </div>

              {/* Sort options */}
              <div className="flex items-center">
                <label
                  htmlFor="sort-select"
                  className="mr-2 text-sm font-medium text-gray-700"
                >
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="points-high">Highest points</option>
                  <option value="points-low">Lowest points</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Map view */}
        {viewMode === "map" && !isLoading && entries.length > 0 && (
          <DynamicStationMap entries={sortedEntries} />
        )}

        {/* Collection list */}
        {viewMode === "list" && sortedEntries.length > 0 && (
          <div>
            {sortedEntries.map((entry) => (
              <StationCard
                key={entry.stationId}
                station={entry.station}
                isCollected={true}
                onRemoveFromCollection={() =>
                  handleRemoveStation(entry.stationId)
                }
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
