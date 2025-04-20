const fs = require("fs");
const path = require("path");
const { createObjectCsvWriter } = require("csv-writer");
const Papa = require("papaparse");

// Configuration
const INPUT_FILE = path.join(__dirname, "../public/data/station-data.csv");
const OUTPUT_FILE = path.join(
  __dirname,
  "../public/data/station-data-updated.csv"
);

// Function to check if a station is a main station
function isMainStation(name) {
  const mainStationPatterns = ["Hbf", "hbf", "Hauptbahnhof", "hauptbahnhof"];
  return mainStationPatterns.some((pattern) => name.includes(pattern));
}

async function updateStationsData() {
  try {
    // Read the CSV file
    const fileContent = fs.readFileSync(INPUT_FILE, "utf8");

    // Parse CSV
    const results = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    console.log(`Read ${results.data.length} stations from CSV.`);

    // Add isMainStation field to each station
    const updatedData = results.data.map((station) => ({
      ...station,
      isMainStation: isMainStation(station.Name),
    }));

    // Get headers from the first row and add new column
    const headers = [...results.meta.fields, "isMainStation"];

    // Create CSV writer with updated headers
    const csvWriter = createObjectCsvWriter({
      path: OUTPUT_FILE,
      header: headers.map((field) => ({ id: field, title: field })),
      fieldDelimiter: ";",
    });

    // Write updated data
    await csvWriter.writeRecords(updatedData);

    // Count main stations
    const mainStationsCount = updatedData.filter(
      (station) => station.isMainStation
    ).length;

    console.log(`Successfully updated CSV file:`);
    console.log(`- Total stations: ${updatedData.length}`);
    console.log(`- Main stations identified: ${mainStationsCount}`);
    console.log(`- Output written to: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Error updating stations data:", error);
  }
}

// Run the script
updateStationsData();
