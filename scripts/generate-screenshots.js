const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Create a simple screenshot placeholder
async function createScreenshot() {
  const width = 540;
  const height = 720;

  // Create a simple SVG with text
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#0052D4"/>
      <text x="50%" y="40%" font-family="Arial" font-size="36" fill="white" text-anchor="middle">Bahnhofjaeger</text>
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle">Collect train stations</text>
      <text x="50%" y="60%" font-family="Arial" font-size="24" fill="white" text-anchor="middle">and earn points!</text>
      
      <rect x="120" y="420" width="300" height="200" rx="10" fill="white"/>
      <circle cx="170" cy="470" r="30" fill="#0052D4"/>
      <circle cx="270" cy="470" r="30" fill="#0052D4"/>
      <circle cx="370" cy="470" r="30" fill="#0052D4"/>
      <rect x="145" y="520" width="250" height="10" rx="5" fill="#0052D4"/>
      <rect x="145" y="550" width="250" height="10" rx="5" fill="#0052D4"/>
      <rect x="145" y="580" width="150" height="10" rx="5" fill="#0052D4"/>
    </svg>
  `;

  // Convert SVG to JPEG
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toFile(path.join(__dirname, "../public/screenshot-wide.jpg"));

  console.log("Created screenshot");
}

createScreenshot().catch(console.error);
