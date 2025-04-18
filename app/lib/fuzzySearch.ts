import { Station } from "./db";

// Calculate a simple similarity score between two strings
// Returns a number between 0 (no match) and 1 (perfect match)
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Exact match gets perfect score
  if (s1 === s2) {
    return 1.0;
  }

  // Starting with the search term gets very high score
  if (s1.startsWith(s2)) {
    return 0.9 + 0.1 * (s2.length / s1.length);
  }

  // If search term is in the station name (but not at start)
  if (s1.includes(s2)) {
    // The closer to the beginning, the higher the score
    const position = s1.indexOf(s2);
    const positionPenalty = position / s1.length;
    return 0.8 - 0.3 * positionPenalty;
  }

  // If station name is in the search term
  if (s2.includes(s1)) {
    return 0.7 * (s1.length / s2.length);
  }

  // Otherwise calculate a more complex similarity
  let matches = 0;

  // Check for character matches
  const minLength = Math.min(s1.length, s2.length);
  for (let i = 0; i < minLength; i++) {
    if (s1[i] === s2[i]) {
      matches++;
    }
  }

  // Calculate word overlap for multi-word strings
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const wordSet1 = new Set(words1);
  const wordSet2 = new Set(words2);

  let wordMatches = 0;
  for (const word of wordSet1) {
    if (wordSet2.has(word)) {
      wordMatches++;
    }
  }

  // Combine character and word matching
  const charScore = matches / Math.max(s1.length, s2.length);
  const wordScore = wordMatches / Math.max(wordSet1.size, wordSet2.size);

  // Weight word matches more heavily
  return 0.1 + charScore * 0.3 + wordScore * 0.5;
}

// Search stations with fuzzy matching and return results sorted by relevance
export interface StationWithScore {
  station: Station;
  score: number;
  matchScore: number;
}

export function fuzzySearchStations(
  stations: Station[],
  query: string,
  limit = 10
): StationWithScore[] {
  if (!query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Map stations to [station, score] pairs
  const scored = stations.map((station) => {
    // Base score from text matching
    const matchScore = calculateSimilarity(station.name, normalizedQuery);

    // Normalize point value to 0-1 range (assuming max point value of 70)
    // Higher priceClass stations get priority when match scores are similar
    const pointScore = station.pointValue / 70;

    // Boost for main stations (Hauptbahnhof/Hbf)
    let mainStationBoost = 0;
    const lowerName = station.name.toLowerCase();

    // Comprehensive check for main stations with proper word boundaries
    if (
      lowerName.includes("hauptbahnhof") ||
      lowerName.includes(" hbf") ||
      lowerName.endsWith(" hbf") ||
      lowerName.includes("hbf ") ||
      lowerName === "hbf"
    ) {
      // Give a significant boost to main stations
      mainStationBoost = 0.15;
    }

    // Combined score: 70% match quality, 15% point value, 15% main station boost
    const combinedScore =
      matchScore * 0.7 + pointScore * 0.15 + mainStationBoost;

    return {
      station,
      score: combinedScore,
      matchScore, // Keep original match score for reference
    };
  });

  // Filter to include only stations with a minimum similarity
  const MIN_SIMILARITY = 0.3;
  const filtered = scored.filter((item) => item.matchScore >= MIN_SIMILARITY);

  // Sort by combined score (descending)
  const sorted = filtered.sort((a, b) => b.score - a.score);

  // Return the top N results with scores
  return sorted.slice(0, limit);
}
