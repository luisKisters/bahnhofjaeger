import { getDB, Station, CollectionEntry, CollectionStats } from "./db";

// Add a station to the user's collection
export async function addStationToCollection(
  station: Station
): Promise<boolean> {
  const db = await getDB();

  // Check if station already exists in collection
  const existingEntry = await db.get("collection", station.id);
  if (existingEntry) {
    return false; // Station already in collection
  }

  // Start a transaction for both collection and stats
  const tx = db.transaction(["collection", "stats"], "readwrite");

  // Create entry for collection
  const entry: CollectionEntry = {
    stationId: station.id,
    timestamp: Date.now(),
    station: station,
  };

  // Add to collection
  await tx.objectStore("collection").add(entry);

  // Update stats
  const statsStore = tx.objectStore("stats");
  const stats = (await statsStore.get("collection-stats")) as CollectionStats;

  if (stats) {
    stats.totalStations += 1;
    stats.totalPoints += station.pointValue;
    stats.lastUpdated = Date.now();
    await statsStore.put(stats);
  }

  // Complete transaction
  await tx.done;
  return true;
}

// Remove a station from the collection
export async function removeStationFromCollection(
  stationId: string
): Promise<boolean> {
  const db = await getDB();

  // Check if station exists in collection
  const entry = (await db.get("collection", stationId)) as CollectionEntry;
  if (!entry) {
    return false; // Station not in collection
  }

  // Start a transaction for both collection and stats
  const tx = db.transaction(["collection", "stats"], "readwrite");

  // Remove from collection
  await tx.objectStore("collection").delete(stationId);

  // Update stats
  const statsStore = tx.objectStore("stats");
  const stats = (await statsStore.get("collection-stats")) as CollectionStats;

  if (stats) {
    stats.totalStations -= 1;
    stats.totalPoints -= entry.station.pointValue;
    stats.lastUpdated = Date.now();
    await statsStore.put(stats);
  }

  // Complete transaction
  await tx.done;
  return true;
}

// Get all stations in the user's collection
export async function getCollection(): Promise<CollectionEntry[]> {
  const db = await getDB();
  return db.getAll("collection");
}

// Get collection stats
export async function getCollectionStats(): Promise<CollectionStats> {
  const db = await getDB();
  const stats = (await db.get("stats", "collection-stats")) as CollectionStats;

  // Calculate price class statistics
  const priceClassStats = await calculatePriceClassStats();

  // Get stations added this month
  const stationsThisMonth = await getStationsThisMonth();

  // If stats exist, update with calculated values
  if (stats) {
    stats.priceClassStats = priceClassStats;
    stats.stationsThisMonth = stationsThisMonth;

    // Update stats in the database
    const tx = db.transaction("stats", "readwrite");
    await tx.objectStore("stats").put(stats);
    await tx.done;

    return stats;
  }

  // If no stats exist, create default stats
  return {
    key: "collection-stats",
    totalPoints: 0,
    totalStations: 0,
    lastUpdated: Date.now(),
    firstLaunch: false,
    priceClassStats,
    stationsThisMonth,
  };
}

// Check if a station is in the collection
export async function isStationInCollection(
  stationId: string
): Promise<boolean> {
  const db = await getDB();
  const entry = await db.get("collection", stationId);
  return !!entry;
}

// Get sorted collection (by timestamp, newest first)
export async function getSortedCollection(): Promise<CollectionEntry[]> {
  const collection = await getCollection();
  return collection.sort((a, b) => b.timestamp - a.timestamp);
}

// Calculate price class statistics
export async function calculatePriceClassStats(): Promise<{
  [key: number]: { collected: number; total: number };
}> {
  const db = await getDB();

  // Get all stations
  const allStations = await db.getAll("stations");

  // Get user's collection
  const collection = await getCollection();
  const collectedStationIds = new Set(
    collection.map((entry) => entry.stationId)
  );

  // Calculate stats by price class
  const priceClassStats: {
    [key: number]: { collected: number; total: number };
  } = {};

  // Initialize with all price classes (1-7)
  for (let i = 1; i <= 7; i++) {
    priceClassStats[i] = { collected: 0, total: 0 };
  }

  // Count total stations per price class
  for (const station of allStations) {
    if (station.priceClass >= 1 && station.priceClass <= 7) {
      priceClassStats[station.priceClass].total++;

      // Check if this station is in the user's collection
      if (collectedStationIds.has(station.id)) {
        priceClassStats[station.priceClass].collected++;
      }
    }
  }

  return priceClassStats;
}

// Calculate stations added this month
export async function getStationsThisMonth(): Promise<number> {
  const db = await getDB();
  const collection = await db.getAll("collection");

  // Get current month boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  ).getTime();

  // Count stations added this month
  const stationsThisMonth = collection.filter(
    (entry) => entry.timestamp >= startOfMonth && entry.timestamp <= endOfMonth
  ).length;

  return stationsThisMonth;
}
