const fs = require("fs");
const path = require("path");
const { createObjectCsvWriter } = require("csv-writer");
const dotenv = require("dotenv");
const axios = require("axios");

// Load environment variables
dotenv.config();

// DB API credentials
const DB_CLIENT_ID = process.env.DB_CLIENT_ID;
const DB_SECRET = process.env.DB_SECRET;

if (!DB_CLIENT_ID || !DB_SECRET) {
  console.error(
    "Error: DB_CLIENT_ID and DB_SECRET must be defined in .env file"
  );
  process.exit(1);
}

// Configuration
const INPUT_FILE = path.join(
  __dirname,
  "../data/Stationspreisliste-2025-final.csv"
);
const OUTPUT_FILE = path.join(
  __dirname,
  "../data/Stationspreisliste-2025-enriched.csv"
);
const API_URL =
  "https://apis.deutschebahn.com/db-api-marketplace/apis/station-data/v2/stations";
const DELAY_MS = 50; // Delay between API requests to avoid rate limiting

// Function to fetch station data from DB API
async function fetchStationData(stationName) {
  try {
    const response = await axios.get(API_URL, {
      params: {
        searchstring: stationName,
        limit: 5, // Limit to avoid large responses
      },
      headers: {
        Accept: "application/json",
        "DB-Client-ID": DB_CLIENT_ID,
        "DB-Api-Key": DB_SECRET,
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching data for station ${stationName}:`, error);
    return null;
  }
}

// Function to find the best match for a station by name
function findBestMatch(apiData, stationName, stationCategory) {
  if (!apiData.result || apiData.result.length === 0) {
    return null;
  }

  // First try to find an exact match with the same category
  const exactMatch = apiData.result.find(
    (station) =>
      station.name.toLowerCase() === stationName.toLowerCase() &&
      station.category.toString() === stationCategory
  );

  if (exactMatch) {
    return exactMatch;
  }

  // If no exact match with category, try exact match by name
  const nameMatch = apiData.result.find(
    (station) => station.name.toLowerCase() === stationName.toLowerCase()
  );

  if (nameMatch) {
    return nameMatch;
  }

  // If still no match, return the first result
  return apiData.result[0];
}

// Function to generate a UUID
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Function to parse a CSV line manually
function parseCSVLine(line) {
  const parts = line.split(";");
  return {
    number: parts[0] || "",
    verbund: parts[1] || "",
    name: parts[2] || "",
    category: parts[3] || "",
    federalState: parts[4] || "",
    priceSmall: parts[5] || "",
    priceLarge: parts[6] || "",
  };
}

// Main function to process the CSV and fetch data
async function processStationsData() {
  const stationData = [];

  try {
    // Read file content
    const fileContent = fs.readFileSync(INPUT_FILE, "utf8");
    const lines = fileContent.split("\n");

    // Skip the first line (header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.includes("Bemerkung")) {
        const station = parseCSVLine(line);
        if (station.name) {
          stationData.push(station);

          // Log progress
          if (stationData.length % 500 === 0) {
            console.log(`Added ${stationData.length} stations...`);
          }
        }
      }
    }

    console.log(`Read ${stationData.length} stations from CSV.`);
    await enrichStationData(stationData);
  } catch (error) {
    console.error("Error reading CSV file:", error);
  }
}

// Function to enrich station data with API data
async function enrichStationData(stationData) {
  const enrichedData = [];
  let processed = 0;

  console.log(`Starting to enrich ${stationData.length} stations...`);

  for (const station of stationData) {
    processed++;

    // Skip rows with no name
    if (!station.name) {
      enrichedData.push({ ...station });
      continue;
    }

    // Log progress
    if (processed % 100 === 0) {
      console.log(`Processed ${processed}/${stationData.length} stations`);
    }

    const enrichedStation = { ...station };

    try {
      // Fetch data from API
      const apiData = await fetchStationData(station.name);

      // Add a delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

      if (apiData && apiData.result && apiData.result.length > 0) {
        const bestMatch = findBestMatch(
          apiData,
          station.name,
          station.category
        );

        if (bestMatch) {
          // Extract main EVA number and coordinates
          const mainEva = bestMatch.evaNumbers?.find((eva) => eva.isMain);

          enrichedStation.evaNumber = mainEva?.number?.toString();
          enrichedStation.latitude =
            mainEva?.geographicCoordinates?.coordinates[1];
          enrichedStation.longitude =
            mainEva?.geographicCoordinates?.coordinates[0];

          // Add address information
          enrichedStation.city = bestMatch.mailingAddress?.city;
          enrichedStation.zipcode = bestMatch.mailingAddress?.zipcode;
          enrichedStation.street = bestMatch.mailingAddress?.street;

          // Add Aufgabentraeger information
          enrichedStation.aufgabentraegerShortName =
            bestMatch.aufgabentraeger?.shortName;
          enrichedStation.aufgabentraegerName = bestMatch.aufgabentraeger?.name;

          // Add ProductLine information
          enrichedStation.productLine = bestMatch.productLine?.productLine;
          enrichedStation.segment = bestMatch.productLine?.segment;

          // Add amenities
          enrichedStation.hasParking = bestMatch.hasParking;
          enrichedStation.hasWifi = bestMatch.hasWiFi;
          enrichedStation.hasDBLounge = bestMatch.hasDBLounge;
        }
      }

      // Generate a UUID for each station
      enrichedStation.uuid = generateUUID();

      enrichedData.push(enrichedStation);
    } catch (error) {
      console.error(`Error processing station ${station.name}:`, error);
      enrichedData.push({ ...station, uuid: generateUUID() });
    }
  }

  // Write the enriched data to CSV
  await writeEnrichedCsv(enrichedData);
}

// Function to write the enriched data to CSV
async function writeEnrichedCsv(data) {
  const csvWriter = createObjectCsvWriter({
    path: OUTPUT_FILE,
    header: [
      { id: "uuid", title: "UUID" },
      { id: "number", title: "Station_Number" },
      { id: "evaNumber", title: "EVA_Number" },
      { id: "name", title: "Name" },
      { id: "category", title: "Category" },
      { id: "federalState", title: "Federal_State" },
      { id: "priceSmall", title: "Price_Small" },
      { id: "priceLarge", title: "Price_Large" },
      { id: "longitude", title: "Longitude" },
      { id: "latitude", title: "Latitude" },
      { id: "city", title: "City" },
      { id: "zipcode", title: "Zipcode" },
      { id: "street", title: "Street" },
      { id: "verbund", title: "Verbund" },
      { id: "aufgabentraegerShortName", title: "Aufgabentraeger_ShortName" },
      { id: "aufgabentraegerName", title: "Aufgabentraeger_Name" },
      { id: "productLine", title: "ProductLine" },
      { id: "segment", title: "Segment" },
      { id: "hasParking", title: "HasParking" },
      { id: "hasWifi", title: "HasWiFi" },
      { id: "hasDBLounge", title: "HasDBLounge" },
    ],
    fieldDelimiter: ";",
  });

  try {
    await csvWriter.writeRecords(data);
    console.log(`Successfully wrote enriched data to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Error writing CSV:", error);
  }
}

// Run the script
processStationsData();
