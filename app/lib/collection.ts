import {
  getDB,
  Station,
  CollectionEntry,
  CollectionStats,
  initializeStats,
} from "./db";

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

  const priceClassStats = await calculatePriceClassStats();
  const mainStationStats = await calculateMainStationStats();
  const stationsThisMonth = await getStationsThisMonth();
  const levelStats = await calculateLevelStats();
  const monthStreakStats = await calculateMonthStreak();

  // If stats exist, update with calculated values
  if (stats) {
    stats.priceClassStats = priceClassStats;
    stats.mainStationStats = mainStationStats;
    stats.stationsThisMonth = stationsThisMonth;
    stats.level = levelStats;
    stats.monthStreak = monthStreakStats;

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
    mainStationStats,
    level: "Eisen I",
    monthStreak: 0,
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

// Calculate main station statistics
export async function calculateMainStationStats(): Promise<{
  collected: number;
  total: number;
}> {
  const db = await getDB();

  // Get all stations
  const allStations = await db.getAll("stations");

  // Get user's collection
  const collection = await getCollection();

  console.log("collection", collection);

  // Calculate main station statistics
  const mainStationStats: {
    collected: number;
    total: number;
  } = {
    collected: collection.filter((entry) => entry.station.isMainStation).length,
    total: allStations.filter((station) => station.isMainStation).length,
  };

  return mainStationStats;
}

// Calculate level
export async function calculateLevelStats() {
  const db = await getDB();
  const stats = await db.get("stats", "collection-stats");

  // Check if stats exists and has the required property
  if (!stats || typeof stats.totalPoints !== "number") {
    // Initialize stats if they don't exist
    await initializeStats();
    return "Eisen I"; // Default rank for new users
  }

  const totalPoints = stats.totalPoints;
  console.log("check", typeof totalPoints === "number");

  // Now we can safely calculate the rank, including the case where totalPoints is 0
  let rank = "Eisen I";
  if (totalPoints >= 50000) rank = "Meister III";
  else if (totalPoints >= 35000) rank = "Meister II";
  else if (totalPoints >= 25000) rank = "Meister I";
  else if (totalPoints >= 20000) rank = "Diamant III";
  else if (totalPoints >= 16000) rank = "Diamant II";
  else if (totalPoints >= 12000) rank = "Diamant I";
  else if (totalPoints >= 10000) rank = "Platin III";
  else if (totalPoints >= 8000) rank = "Platin II";
  else if (totalPoints >= 6000) rank = "Platin I";
  else if (totalPoints >= 5000) rank = "Gold III";
  else if (totalPoints >= 4000) rank = "Gold II";
  else if (totalPoints >= 3000) rank = "Gold I";
  else if (totalPoints >= 2500) rank = "Silber III";
  else if (totalPoints >= 2000) rank = "Silber II";
  else if (totalPoints >= 1500) rank = "Silber I";
  else if (totalPoints >= 1250) rank = "Bronze III";
  else if (totalPoints >= 1000) rank = "Bronze II";
  else if (totalPoints >= 750) rank = "Bronze I";
  else if (totalPoints >= 500) rank = "Eisen III";
  else if (totalPoints >= 250) rank = "Eisen II";

  return rank;
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

function getMonthsBetween(startDate: Date, endDate: Date): string[] {
  const months: string[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (current <= endDate) {
    months.push(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(
        2,
        "0"
      )}`
    );
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

export async function calculateMonthStreak() {
  const collection = await getSortedCollection();

  if (!collection || collection.length === 0) {
    return 0;
  }

  const startDate = new Date(collection[collection.length - 1].timestamp);
  const endDate = new Date(collection[0].timestamp);

  const currentMonth = new Date().toISOString().slice(0, 7);

  if (!JSON.stringify(new Date(endDate)).includes(currentMonth)) {
    return 0;
  }

  const range = getMonthsBetween(startDate, endDate);

  const monthsWithEntries = collection
    .map((entry) => new Date(entry.timestamp).toISOString().slice(0, 7))
    .filter((item, index, array) => array.indexOf(item) === index);

  let streak = 0;

  console.log("starting.");
  for (const month of range.reverse()) {
    if (monthsWithEntries.includes(month)) {
      streak++;
    } else break;
  }
  return streak;
}
