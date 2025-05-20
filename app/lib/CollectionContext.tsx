import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Station, CollectionEntry, CollectionStats } from "./db";
import {
  getCollectionStats,
  getSortedCollection,
  addStationToCollection,
  removeStationFromCollection,
} from "./collection";

interface CollectionContextValue {
  isLoading: boolean;
  entries: CollectionEntry[];
  stats: CollectionStats;
  error: Error | null;
  addStation: (station: Station) => Promise<boolean>;
  removeStation: (stationId: string) => Promise<boolean>;
  refreshCollection: () => Promise<void>;
}

const CollectionContext = createContext<CollectionContextValue | undefined>(
  undefined
);

export const CollectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [stats, setStats] = useState<CollectionStats>({
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
  });
  const [error, setError] = useState<Error | null>(null);

  const loadCollection = useCallback(async () => {
    setIsLoading(true);
    try {
      const [entries, stats] = await Promise.all([
        getSortedCollection(),
        getCollectionStats(),
      ]);
      setEntries(entries);
      setStats(stats);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load collection")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addStation = useCallback(
    async (station: Station) => {
      try {
        const success = await addStationToCollection(station);
        if (success) await loadCollection();
        return success;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to add station")
        );
        return false;
      }
    },
    [loadCollection]
  );

  const removeStation = useCallback(
    async (stationId: string) => {
      try {
        const success = await removeStationFromCollection(stationId);
        if (success) await loadCollection();
        return success;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to remove station")
        );
        return false;
      }
    },
    [loadCollection]
  );

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  return (
    <CollectionContext.Provider
      value={{
        isLoading,
        entries,
        stats,
        error,
        addStation,
        removeStation,
        refreshCollection: loadCollection,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
};

export function useCollectionContext() {
  const ctx = useContext(CollectionContext);
  if (!ctx)
    throw new Error(
      "useCollectionContext must be used within a CollectionProvider"
    );
  return ctx;
}
