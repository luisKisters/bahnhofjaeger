import { Station } from "./db";

// Calculate a simple similarity score between two strings
// Returns a number between 0 (no match) and 1 (perfect match)
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // If one is a substring of the other, give a high score
  if (s1.includes(s2) || s2.includes(s1)) {
    // The closer in length, the higher the score
    const lengthRatio =
      Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
    // Give more weight to this type of match
    return 0.7 + 0.3 * lengthRatio;
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
  return charScore * 0.4 + wordScore * 0.6;
}

// Search stations with fuzzy matching and return results sorted by relevance
export function fuzzySearchStations(
  stations: Station[],
  query: string,
  limit = 10
): Station[] {
  if (!query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Map stations to [station, score] pairs
  const scored = stations.map((station) => {
    const score = calculateSimilarity(station.name, normalizedQuery);
    return { station, score };
  });

  // Filter to include only stations with a minimum similarity
  const MIN_SIMILARITY = 0.3;
  const filtered = scored.filter((item) => item.score >= MIN_SIMILARITY);

  // Sort by score (descending)
  const sorted = filtered.sort((a, b) => b.score - a.score);

  // Return the top N results
  return sorted.slice(0, limit).map((item) => item.station);
}
