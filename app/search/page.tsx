"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/app/components/Layout";
import SearchInput from "@/app/components/SearchInput";
import StationCard from "@/app/components/StationCard";
import { useStationSearch } from "@/app/lib/useStationSearch";
import { useCollection } from "@/app/lib/useCollection";
import { getAllStations, searchStationsByName } from "@/app/lib/stations";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    isLoading,
    results,
    collectionStatus,
    error,
    refreshCollectionStatus,
  } = useStationSearch(searchQuery);
  const { addStation } = useCollection();
  const [debugInfo, setDebugInfo] = useState<{ totalStations: number }>({
    totalStations: 0,
  });

  // Debug effect - check total stations on mount
  useEffect(() => {
    const checkStations = async () => {
      try {
        const stations = await getAllStations();
        console.log(
          `Search page mounted, found ${stations.length} stations in database`
        );
        setDebugInfo({ totalStations: stations.length });

        // Try a test search
        if (stations.length > 0) {
          const testResult = await searchStationsByName("a");
          console.log(
            `Test search for 'a' returned ${testResult.length} results`
          );
        }
      } catch (error) {
        console.error("Error checking stations:", error);
      }
    };

    checkStations();
  }, []);

  const handleSearch = (query: string) => {
    console.log(`Search input changed to "${query}"`);
    setSearchQuery(query);
  };

  const handleAddToCollection = async (stationId: string) => {
    console.log(`Adding station ${stationId} to collection`);
    const station = results.find((s) => s.id === stationId);
    if (station) {
      const success = await addStation(station);
      console.log(`Add to collection ${success ? "successful" : "failed"}`);
      if (success) {
        await refreshCollectionStatus();
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Search Stations
        </h1>

        {/* Debug info */}
        <div className="text-xs text-gray-500 mb-2">
          Database contains {debugInfo.totalStations} stations
        </div>

        <SearchInput
          onSearch={handleSearch}
          placeholder="Enter station name..."
        />

        <div className="mt-6">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
              Error: {error.message}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center my-8">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}

          {!isLoading && searchQuery && results.length === 0 && (
            <div className="text-center my-8 text-gray-600">
              No stations found for &quot;{searchQuery}&quot;
            </div>
          )}

          {results.length > 0 && (
            <div>
              <div className="text-sm text-gray-500 mb-2">
                Found {results.length}{" "}
                {results.length === 1 ? "station" : "stations"}
              </div>

              {results.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  isCollected={collectionStatus[station.id]}
                  onAddToCollection={
                    !collectionStatus[station.id]
                      ? () => handleAddToCollection(station.id)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
