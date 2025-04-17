"use client";

import React, { useState } from "react";
import Layout from "@/app/components/Layout";
import StatsCard from "@/app/components/StatsCard";
import StationCard from "@/app/components/StationCard";
import { useCollection } from "@/app/lib/useCollection";

// Filter options
type SortOption = "newest" | "oldest" | "points-high" | "points-low" | "name";

export default function CollectionPage() {
  const { isLoading, entries, stats, error, removeStation, refreshCollection } =
    useCollection();
  const [sortOption, setSortOption] = useState<SortOption>("newest");

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
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">My Collection</h1>

        {/* Stats Card */}
        <StatsCard stats={stats} />

        {/* Sort Options */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <label
            htmlFor="sort"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Sort by:
          </label>
          <select
            id="sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="points-high">Highest Points</option>
            <option value="points-low">Lowest Points</option>
            <option value="name">Station Name</option>
          </select>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
            Error: {error.message}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center my-8">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Empty collection */}
        {!isLoading && entries.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600 mb-4">Your collection is empty</p>
            <p className="text-sm text-gray-500">
              Use the search to find and add stations to your collection
            </p>
          </div>
        )}

        {/* Collection list */}
        {sortedEntries.length > 0 && (
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
