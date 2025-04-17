import { useState, useEffect, useCallback } from "react";
import { isFirstLaunch, completeFirstLaunch, getDB } from "./db";
import { fetchAndProcessStations, getAllStations } from "./stations";

interface InitializationState {
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;
  stationCount: number;
  resetDatabase: () => Promise<void>;
}

export function useInitialization(): InitializationState {
  const [state, setState] = useState<
    Omit<InitializationState, "resetDatabase">
  >({
    isLoading: true,
    isInitialized: false,
    error: null,
    stationCount: 0,
  });

  const initialize = useCallback(async () => {
    try {
      console.log("Starting app initialization...");
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Check if this is the first launch
      const firstLaunch = await isFirstLaunch();
      console.log("Is first launch?", firstLaunch);

      // Check if we have stations already
      const existingStations = await getAllStations();
      console.log(`Found ${existingStations.length} existing stations`);

      // If it's the first launch or we don't have stations, import them
      if (firstLaunch || existingStations.length === 0) {
        console.log("Importing stations from CSV...");

        // Import stations from CSV
        const count = await fetchAndProcessStations();
        console.log(`Imported ${count} stations`);

        // Mark first launch as complete
        await completeFirstLaunch();

        setState({
          isLoading: false,
          isInitialized: true,
          error: null,
          stationCount: count,
        });
      } else {
        // Already initialized with data
        setState({
          isLoading: false,
          isInitialized: true,
          error: null,
          stationCount: existingStations.length,
        });
      }
    } catch (error) {
      console.error("Initialization error:", error);
      setState({
        isLoading: false,
        isInitialized: false,
        error:
          error instanceof Error
            ? error
            : new Error("Unknown error during initialization"),
        stationCount: 0,
      });
    }
  }, []);

  // Reset the database for debugging purposes
  const resetDatabase = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      console.log("Resetting database...");

      // Delete the existing database
      const db = await getDB();
      db.close();

      // This will delete the entire database
      await window.indexedDB.deleteDatabase("bahnhofjaeger-db");

      console.log("Database deleted, reloading the page...");

      // Reload the page to reinitialize everything
      window.location.reload();
    } catch (error) {
      console.error("Database reset error:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to reset database"),
      }));
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    ...state,
    resetDatabase,
  };
}
