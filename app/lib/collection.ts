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
  return (
    stats || {
      key: "collection-stats",
      totalPoints: 0,
      totalStations: 0,
      lastUpdated: Date.now(),
      firstLaunch: false,
    }
  );
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
