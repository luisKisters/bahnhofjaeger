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

// Station data from enriched CSV
export interface Station {
  id: string; // UUID is now the primary identifier
  stationNumber: string; // Original station number
  evaNumber?: string; // DB API EVA number
  name: string; // Station name
  priceClass: number; // Category (1-7)
  state: string; // Federal state
  pointValue: number; // Calculated points value
  priceSmall?: string; // Small price value
  priceLarge?: string; // Large price value
  latitude?: number; // Geographical latitude
  longitude?: number; // Geographical longitude
  city?: string; // City from address
  zipcode?: string; // Zipcode from address
  street?: string; // Street address
  verbund?: string; // Original verbund value
  aufgabentraegerShortName?: string; // Aufgabentraeger short name
  aufgabentraegerName?: string; // Aufgabentraeger full name
  productLine?: string; // Product line (e.g. "Knotenbahnhof")
  segment?: string; // Segment information
  hasParking?: boolean; // Has parking facilities
  hasWifi?: boolean; // Has WiFi
  hasDBLounge?: boolean; // Has DB Lounge
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
  priceClassStats: { [key: number]: { collected: number; total: number } };
  stationsThisMonth: number;
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
      priceClassStats: {},
      stationsThisMonth: 0,
    };
    await store.put(stats);
  } else if (!stats.priceClassStats || !("stationsThisMonth" in stats)) {
    // Add new fields to existing stats object if they don't exist
    stats.priceClassStats = stats.priceClassStats || {};
    stats.stationsThisMonth = stats.stationsThisMonth || 0;
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
