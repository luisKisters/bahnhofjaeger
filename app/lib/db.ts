import { openDB, DBSchema, IDBPDatabase } from "idb";

// Define database schema types
interface BahnhofjaegerDB extends DBSchema {
  stations: {
    key: string;
    value: Station;
    indexes: {
      "by-name": string;
      "by-state": string;
      "by-price-class": number;
    };
  };
  collection: {
    key: string;
    value: CollectionEntry;
    indexes: {
      "by-timestamp": number;
    };
  };
  stats: {
    key: "collection-stats";
    value: CollectionStats;
  };
}

// Station data from CSV
export interface Station {
  id: string;
  name: string;
  priceClass: number; // 1-7
  state: string;
  pointValue: number;
}

// User's collection entry
export interface CollectionEntry {
  stationId: string;
  timestamp: number;
  station: Station; // Include the full station data for easier access
}

// Collection stats
export interface CollectionStats {
  key: string;
  totalPoints: number;
  totalStations: number;
  lastUpdated: number;
  firstLaunch: boolean;
}

const DB_NAME = "bahnhofjaeger-db";
const DB_VERSION = 1;

// Initialize the database
export async function initDB(): Promise<IDBPDatabase<BahnhofjaegerDB>> {
  return openDB<BahnhofjaegerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stations store
      if (!db.objectStoreNames.contains("stations")) {
        const stationsStore = db.createObjectStore("stations", {
          keyPath: "id",
        });
        stationsStore.createIndex("by-name", "name", { unique: false });
        stationsStore.createIndex("by-state", "state", { unique: false });
        stationsStore.createIndex("by-price-class", "priceClass", {
          unique: false,
        });
      }

      // Create collection store
      if (!db.objectStoreNames.contains("collection")) {
        const collectionStore = db.createObjectStore("collection", {
          keyPath: "stationId",
        });
        collectionStore.createIndex("by-timestamp", "timestamp", {
          unique: false,
        });
      }

      // Create stats store
      if (!db.objectStoreNames.contains("stats")) {
        db.createObjectStore("stats", { keyPath: "key" });
      }
    },
  });
}

// Get database instance (singleton)
let dbPromise: Promise<IDBPDatabase<BahnhofjaegerDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<BahnhofjaegerDB>> {
  if (!dbPromise) {
    dbPromise = initDB();
  }
  return dbPromise;
}

// Initialize stats if they don't exist
export async function initializeStats(): Promise<CollectionStats> {
  const db = await getDB();
  const tx = db.transaction("stats", "readwrite");
  const store = tx.objectStore("stats");

  let stats = await store.get("collection-stats");

  if (!stats) {
    stats = {
      key: "collection-stats",
      totalPoints: 0,
      totalStations: 0,
      lastUpdated: Date.now(),
      firstLaunch: true,
    };
    await store.put(stats);
  }

  await tx.done;
  return stats;
}

// Check if it's the first launch
export async function isFirstLaunch(): Promise<boolean> {
  const stats = await initializeStats();
  return stats.firstLaunch;
}

// Mark first launch as complete
export async function completeFirstLaunch(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("stats", "readwrite");
  const store = tx.objectStore("stats");

  const stats = await store.get("collection-stats");
  if (stats) {
    stats.firstLaunch = false;
    await store.put(stats);
  }

  await tx.done;
}
