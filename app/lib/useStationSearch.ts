import { useState, useEffect, useCallback } from "react";
import { Station } from "./db";
import { getAllStations } from "./stations";
import { fuzzySearchStations, StationWithScore } from "./fuzzySearch";
import { isStationInCollection } from "./collection";

interface SearchState {
  isLoading: boolean;
  results: StationWithScore[];
  collectionStatus: Record<string, boolean>;
  error: Error | null;
}

export function useStationSearch(query: string) {
  const [state, setState] = useState<SearchState>({
    isLoading: false,
    results: [],
    collectionStatus: {},
    error: null,
  });

  const searchStations = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setState((prev) => ({ ...prev, results: [], isLoading: false }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Get all stations from IndexedDB
      const allStations = await getAllStations();

      // Perform fuzzy search
      const searchResults = fuzzySearchStations(allStations, searchQuery);

      // Check collection status for each result
      const statusMap: Record<string, boolean> = {};

      for (const { station } of searchResults) {
        statusMap[station.id] = await isStationInCollection(station.id);
      }

      setState({
        isLoading: false,
        results: searchResults,
        collectionStatus: statusMap,
        error: null,
      });
    } catch (error) {
      setState({
        isLoading: false,
        results: [],
        collectionStatus: {},
        error: error instanceof Error ? error : new Error("Search failed"),
      });
    }
  }, []);

  // Effect to trigger search when query changes
  useEffect(() => {
    const timerId = setTimeout(() => {
      searchStations(query);
    }, 300); // Debounce search for better performance

    return () => clearTimeout(timerId);
  }, [query, searchStations]);

  // Method to refresh collection status (call after adding/removing)
  const refreshCollectionStatus = useCallback(async () => {
    if (state.results.length === 0) return;

    try {
      const statusMap: Record<string, boolean> = {};

      for (const { station } of state.results) {
        statusMap[station.id] = await isStationInCollection(station.id);
      }

      setState((prev) => ({
        ...prev,
        collectionStatus: statusMap,
      }));
    } catch (error) {
      console.error("Failed to refresh collection status:", error);
    }
  }, [state.results]);

  return {
    ...state,
    refreshCollectionStatus,
  };
}
