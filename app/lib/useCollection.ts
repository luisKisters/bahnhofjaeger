import { useState, useEffect, useCallback } from "react";
import { Station, CollectionEntry, CollectionStats } from "./db";
import {
  getCollectionStats,
  getSortedCollection,
  addStationToCollection,
  removeStationFromCollection,
} from "./collection";
import { useCollectionContext } from "./CollectionContext";

interface CollectionState {
  isLoading: boolean;
  entries: CollectionEntry[];
  stats: CollectionStats;
  error: Error | null;
  refreshCollection: () => Promise<void>;
  addStation: (station: Station) => Promise<boolean>;
  removeStation: (stationId: string) => Promise<boolean>;
}

export function useCollection(): CollectionState {
  // Try to use context if available
  try {
    return useCollectionContext();
  } catch {
    // Not in provider, fallback to local state
  }

  const [state, setState] = useState<CollectionState>({
    isLoading: true,
    entries: [],
    stats: {
      key: "collection-stats",
      totalStations: 0,
      lastUpdated: 0,
      firstLaunch: false,
      priceClassStats: {},
      stationsThisMonth: 0,
      mainStationStats: { collected: 0, total: 0 },
      level: "Eisen I",
      totalPoints: 0,
      monthStreak: 0,
    },
    error: null,
    refreshCollection: async () => {},
    addStation: async () => false,
    removeStation: async () => false,
  });

  // Load collection data
  const loadCollection = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Get collection entries and stats in parallel
      const [entries, stats] = await Promise.all([
        getSortedCollection(),
        getCollectionStats(),
      ]);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        entries,
        stats,
        error: null,
      }));
    } catch (error) {
      console.error("Error in useCollection:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to load collection"),
      }));
    }
  }, []);

  // Add station to collection
  const addStation = useCallback(
    async (station: Station) => {
      try {
        const success = await addStationToCollection(station);

        if (success) {
          // Reload collection to get updated data
          await loadCollection();
        }

        return success;
      } catch (error) {
        console.error("Failed to add station:", error);
        return false;
      }
    },
    [loadCollection]
  );

  // Remove station from collection
  const removeStation = useCallback(
    async (stationId: string) => {
      try {
        const success = await removeStationFromCollection(stationId);

        if (success) {
          // Reload collection to get updated data
          await loadCollection();
        }

        return success;
      } catch (error) {
        console.error("Failed to remove station:", error);
        return false;
      }
    },
    [loadCollection]
  );

  // Load collection on mount
  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  return {
    ...state,
    refreshCollection: loadCollection,
    addStation,
    removeStation,
  };
}
