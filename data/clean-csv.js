const fs = require("fs");
const path = require("path");

// Path to the CSV file
const sourcePath =
  "/Users/luiskisters/Downloads/Stationspreisliste-2025-cleaned.csv";
const outputPath =
  "/Users/luiskisters/Downloads/Stationspreisliste-2025-cleaned-no-empty-rows.csv";

// Read the file
const data = fs.readFileSync(sourcePath, "utf8");

// Split into lines
const lines = data.split("\n");

// Filter out empty lines
const nonEmptyLines = lines.filter((line) => {
  // Trim the line and check if it's empty or just contains delimiters
  const trimmed = line.trim();
  return trimmed !== "" && !trimmed.match(/^[;,\s]*$/);
});

// Join back into a string
const cleanedData = nonEmptyLines.join("\n");

// Write the cleaned data to a new file
fs.writeFileSync(outputPath, cleanedData);

console.log(`Processed ${lines.length} lines`);
console.log(`Removed ${lines.length - nonEmptyLines.length} empty lines`);
console.log(`Saved clean file to ${outputPath}`);
