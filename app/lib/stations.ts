import Papa from "papaparse";
import { Station, getDB } from "./db";

// Calculate point value based on price class
function calculatePoints(priceClass: number): number {
  // Higher price class = lower points (PK1 is highest value)
  // Simply invert the scale and multiply by 10 for more meaningful points
  return (8 - priceClass) * 10;
}

// Parse CSV row to Station object from enriched data
function parseStationRow(row: any): Station | null {
  try {
    // Log each row for debugging
    console.log("Parsing row:", row);

    // Map to the enriched CSV column schema
    const uuid = row.UUID;
    const stationNumber = row.Station_Number;
    const evaNumber = row.EVA_Number;
    const name = row.Name;
    const priceClassStr = row.Category;
    const state = row.Federal_State;
    const priceSmall = row.Price_Small;
    const priceLarge = row.Price_Large;
    const longitude = parseFloat(row.Longitude);
    const latitude = parseFloat(row.Latitude);
    const city = row.City;
    const zipcode = row.Zipcode;
    const street = row.Street;
    const verbund = row.Verbund;
    const aufgabentraegerShortName = row.Aufgabentraeger_ShortName;
    const aufgabentraegerName = row.Aufgabentraeger_Name;
    const productLine = row.ProductLine;
    const segment = row.Segment;
    const hasParking = row.HasParking === "true";
    const hasWifi = row.HasWiFi === "true";
    const hasDBLounge = row.HasDBLounge === "true";

    // Skip invalid rows
    if (!uuid) {
      console.log("Row missing UUID");
      return null;
    }

    if (!name) {
      console.log("Row missing station name");
      return null;
    }

    if (!priceClassStr) {
      console.log("Row missing price class");
      return null;
    }

    // Convert price class to number and validate
    const priceClass = parseInt(priceClassStr.toString().trim(), 10);
    if (isNaN(priceClass) || priceClass < 1 || priceClass > 7) {
      console.log(`Invalid price class: "${priceClassStr}"`);
      return null;
    }

    // Create and return the station object
    return {
      id: uuid.trim(),
      stationNumber: stationNumber || "",
      evaNumber: evaNumber || undefined,
      name: name.trim(),
      priceClass,
      state: state?.trim() || "Unknown",
      pointValue: calculatePoints(priceClass),
      priceSmall,
      priceLarge,
      latitude: isNaN(latitude) ? undefined : latitude,
      longitude: isNaN(longitude) ? undefined : longitude,
      city,
      zipcode,
      street,
      verbund,
      aufgabentraegerShortName,
      aufgabentraegerName,
      productLine,
      segment,
      hasParking,
      hasWifi,
      hasDBLounge,
    };
  } catch (error) {
    console.error("Error parsing row:", error, row);
    return null;
  }
}

// Import stations from CSV file
export async function importStationsFromCSV(csvData: string): Promise<number> {
  console.log("Starting CSV import, data length:", csvData.length);
  console.log("First 200 characters:", csvData.substring(0, 200));

  return new Promise((resolve, reject) => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          console.log("CSV parsed with headers:", results.meta.fields);
          console.log("Total rows parsed:", results.data.length);

          if (results.data.length === 0) {
            console.error("No data rows found in CSV");
            reject(new Error("No data rows found in CSV"));
            return;
          }

          console.log("First row sample:", results.data[0]);

          // Create stations from valid rows
          const stations: Station[] = [];

          for (const row of results.data) {
            const station = parseStationRow(row);
            if (station) {
              stations.push(station);
            }
          }

          console.log(
            `Valid stations processed: ${stations.length}/${results.data.length}`
          );

          if (stations.length === 0) {
            console.error("No valid stations found in CSV");
            reject(new Error("No valid stations found in CSV"));
            return;
          }

          // Store stations in IndexedDB
          await storeStations(stations);
          resolve(stations.length);
        } catch (error: unknown) {
          console.error("Error during CSV processing:", error);
          reject(error);
        }
      },
      error: (error: Error) => {
        console.error("CSV parsing error:", error);
        reject(error);
      },
    });
  });
}

// Store stations in IndexedDB
async function storeStations(stations: Station[]): Promise<void> {
  console.log(`Storing ${stations.length} stations in IndexedDB`);

  try {
    const db = await getDB();
    const tx = db.transaction("stations", "readwrite");

    // Clear existing stations first
    console.log("Clearing existing stations...");
    await tx.store.clear();
    console.log("Existing stations cleared");

    // Add all stations
    let count = 0;
    for (const station of stations) {
      await tx.store.put(station);
      count++;

      // Log progress in chunks
      if (count % 100 === 0) {
        console.log(`Stored ${count}/${stations.length} stations`);
      }
    }

    await tx.done;
    console.log(
      `Successfully stored all ${stations.length} stations in IndexedDB`
    );
  } catch (error) {
    console.error("Error storing stations:", error);
    throw error;
  }
}

// Fetch CSV file and process it
export async function fetchAndProcessStations(): Promise<number> {
  try {
    console.log("Attempting to fetch CSV file...");

    // Update path to use the enriched data file
    const response = await fetch("/data/station-data.csv");

    if (!response.ok) {
      console.error(
        `Failed to fetch CSV: ${response.status} ${response.statusText}`
      );
      throw new Error(
        `Failed to fetch CSV: ${response.status} ${response.statusText}`
      );
    }

    console.log("CSV file fetched successfully");
    const csvData = await response.text();
    console.log(`CSV loaded, length: ${csvData.length} characters`);

    return await importStationsFromCSV(csvData);
  } catch (error: unknown) {
    console.error("Failed to fetch and process stations:", error);
    throw error;
  }
}

// Get all stations from IndexedDB
export async function getAllStations(): Promise<Station[]> {
  try {
    console.log("Getting all stations from IndexedDB");
    const db = await getDB();
    const allStations = await db.getAll("stations");
    console.log(`Retrieved ${allStations.length} stations from IndexedDB`);

    if (allStations.length === 0) {
      console.log("No stations found in database!");
    } else {
      console.log("Sample station from database:", allStations[0]);
    }

    return allStations;
  } catch (error) {
    console.error("Error retrieving stations:", error);
    throw error;
  }
}

// Search stations by name (for fuzzy matching)
export async function searchStationsByName(query: string): Promise<Station[]> {
  console.log(`Searching for "${query}"`);

  if (!query.trim()) {
    console.log("Empty query, returning empty results");
    return [];
  }

  try {
    const db = await getDB();
    const tx = db.transaction("stations", "readonly");
    const index = tx.store.index("by-name");

    // Get all stations and filter client-side for fuzzy matching
    const allStations = await index.getAll();

    console.log(
      `Found ${allStations.length} total stations in database for search`
    );

    // Simple case-insensitive partial matching
    const normalizedQuery = query.toLowerCase().trim();
    const results = allStations.filter((station) =>
      station.name.toLowerCase().includes(normalizedQuery)
    );

    console.log(`Search query "${query}" returned ${results.length} results`);
    if (results.length > 0) {
      console.log("First result:", results[0]);
    }

    await tx.done;
    return results;
  } catch (error) {
    console.error("Error during search:", error);
    throw error;
  }
}
