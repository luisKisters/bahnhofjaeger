# -*- coding: utf-8 -*-
import pandas as pd
import re
import os
import json
from dotenv import load_dotenv
from thefuzz import process, fuzz
import google.generativeai as genai

print("Starting unmatched stations matching script...")

# --- Configuration ---
unmatched_stations_file = "unmatched_stations.csv"
turbopass_export_file = "turbopass-export.csv"
output_file_path = "combined_station_matches.csv"
BATCH_SIZE = 10  # Process 10 stations per Gemini call

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)
print("Google Gemini AI initialized.")

# --- Add abbreviation dictionary for German station names ---
station_abbreviations = {
    "hbf": "hauptbahnhof",
    "bf": "bahnhof",
    "hp": "haltepunkt",
    "haltepunkt": "hp",
    "s-bahn": "sbahn",
    "sbahn": "s-bahn",
    "ostbf": "ostbahnhof",
    "westbf": "westbahnhof",
    "nordbf": "nordbahnhof",
    "südbf": "südbahnhof",
    "südbf": "suedbahnhof",
    "sudbf": "suedbahnhof",
    "str": "strasse",
    "str.": "strasse",
    "straße": "strasse",
    "pl": "platz",
    "pl.": "platz",
    "st": "sankt",
    "st.": "sankt",
    # Regional suffixes that might appear in parentheses
    "han": "hannover",
    "b": "berlin",
    "hamb": "hamburg",
    "bay": "bayern",
    "nrw": "nordrhein-westfalen",
    "württ": "württemberg",
    "wrtt": "württemberg",
    "sachs": "sachsen",
    "oberbay": "oberbayern",
    "westf": "westfalen",
    "oberhess": "oberhessen",
    "dillkr": "dillkreis",
    "westerw": "westerwald",
    "vogtl": "vogtland",
    "holst": "holstein",
}


# Function to expand abbreviations in station names
def expand_abbreviations(name, abbrev_dict):
    name_lower = name.lower()

    # First try exact word replacements with word boundaries
    for abbr, full in abbrev_dict.items():
        name_lower = re.sub(r"\b" + re.escape(abbr) + r"\b", full, name_lower)

    return name_lower


# Function to remove parenthetical information
def remove_parenthetical(name):
    # Remove content inside parentheses and any trailing spaces
    return re.sub(r"\s*\([^)]*\)", "", name).strip()


# Function to validate matches with Gemini API
def validate_stations_with_gemini(batch_candidates):
    """
    Use Gemini API to validate matches for a batch of stations

    Args:
        batch_candidates: Dict with station names as keys and lists of potential matches as values

    Returns:
        List of validated matches
    """
    if not batch_candidates:
        return []

    print(f"Preparing Gemini request for {len(batch_candidates)} stations...")

    # Format all the stations and their potential matches for the prompt
    stations_text = ""

    for i, (station_name, candidates) in enumerate(batch_candidates.items()):
        candidates_text = "\n".join(
            [
                f"    {j + 1}. '{match['name']}' (score: {match['score']})"
                for j, match in enumerate(candidates[:10])
            ]
        )  # Include up to 10 candidates

        stations_text += f"Station {i + 1}: '{station_name}'\nPossible matches:\n{candidates_text}\n\n"

    prompt = f"""Match German railway station names from Stationspreisliste with the correct names from Turbopass.

{stations_text}

INSTRUCTIONS:
- For each station, identify which candidate is the correct match (if any)
- Consider abbreviations (Hbf = Hauptbahnhof), spelling variants (ä/ae, ß/ss), and different naming conventions
- Only include stations where you can determine a correct match with high confidence
- If no match can be found, set correct_match_index to null

RESPONSE FORMAT:
Return a JSON array with objects having this structure:
```json
[
  {{
    "station_id": "1",
    "preisliste_name": "Berlin Hbf",
    "correct_match_index": 2,
    "correct_match_name": "Berlin Hauptbahnhof",
    "confidence": 95,
    "explanation": "The match is correct because Hbf is an abbreviation for Hauptbahnhof"
  }},
  {{
    "station_id": "2",
    "preisliste_name": "Another Station",
    "correct_match_index": null,
    "correct_match_name": null,
    "confidence": null,
    "explanation": "No confident match found"
  }},
  ...  
]
```
"""

    print(f"Prompt length: {len(prompt)} characters")
    print("Sending request to Gemini API...")

    try:
        # Create Gemini model
        model = genai.GenerativeModel("gemini-1.5-flash")

        # Set response format to JSON
        generation_config = {
            "temperature": 0.1,
            "response_mime_type": "application/json",
        }

        # Call Gemini API with structured output format
        response = model.generate_content(prompt, generation_config=generation_config)

        # Parse the JSON response
        validated_results = []

        if hasattr(response, "text"):
            print(f"Received response from Gemini: {len(response.text)} characters")
            try:
                # Extract JSON from response text
                text_content = response.text

                # Print the first 200 characters of the response for debugging
                print(f"Response preview: {text_content[:200]}...")

                # Ensure text is valid JSON by removing non-JSON content
                # Find first [ and last ]
                start_idx = text_content.find("[")
                end_idx = text_content.rfind("]") + 1

                if start_idx >= 0 and end_idx > start_idx:
                    json_text = text_content[start_idx:end_idx]
                    print(f"Extracted JSON section length: {len(json_text)} characters")

                    try:
                        json_response = json.loads(json_text)
                        print(
                            f"Successfully parsed JSON with {len(json_response)} items"
                        )

                        # Process each match validation
                        for item in json_response:
                            try:
                                # Extract station ID and match index
                                station_id = item.get("station_id", "").replace(
                                    "Station ", ""
                                )
                                preisliste_name = item.get("preisliste_name", "")
                                match_idx_raw = item.get("correct_match_index")
                                correct_match_name = item.get("correct_match_name", "")
                                confidence = item.get("confidence", 0)

                                # Skip items without a match
                                if match_idx_raw is None:
                                    print(
                                        f"Station {station_id}: {preisliste_name} - No match found"
                                    )
                                    continue

                                # Convert to 0-based index
                                match_idx = int(match_idx_raw) - 1

                                print(
                                    f"Processing match for station {station_id}: {preisliste_name} -> {correct_match_name} (index {match_idx}, confidence: {confidence})"
                                )

                                # Find the station in batch_candidates either by ID or name
                                if station_id.isdigit() and int(station_id) <= len(
                                    batch_candidates
                                ):
                                    station_key = list(batch_candidates.keys())[
                                        int(station_id) - 1
                                    ]
                                else:
                                    station_key = preisliste_name

                                if (
                                    station_key in batch_candidates
                                    and 0
                                    <= match_idx
                                    < len(batch_candidates[station_key])
                                ):
                                    match = batch_candidates[station_key][match_idx]
                                    validated_results.append(
                                        {
                                            "Index1_df0": match["station_index"],
                                            "Serviceeinrichtung_df0": station_key,
                                            "@id": match["turbopass_id"],
                                            "name": match["name"],
                                            "match_score": match["score"],
                                            "match_type": "fuzzy",
                                            "match_subtype": "gemini_validated",
                                            "confidence": confidence,
                                            "explanation": item.get("explanation", ""),
                                        }
                                    )
                                    print(
                                        f"Gemini validated match: '{station_key}' → '{match['name']}' (explanation: {item.get('explanation', 'No explanation')})"
                                    )
                            except Exception as e:
                                print(f"Error processing station match: {str(e)}")
                    except json.JSONDecodeError as e:
                        print(f"JSON parse error: {str(e)}")
                        print(f"Problem JSON: {json_text[:100]}...")
                else:
                    print(f"No valid JSON array found in response")
                    print(f"Raw response: {response.text[:200]}...")
            except Exception as e:
                print(f"Error parsing Gemini response: {str(e)}")
                print(f"Raw response: {response.text[:200]}...")

        print(f"Total validated matches in this batch: {len(validated_results)}")
        return validated_results

    except Exception as e:
        print(f"Error calling Gemini API: {str(e)}")
        return []


# --- Load unmatched stations ---
print(f"Loading unmatched stations from {unmatched_stations_file}...")
try:
    df_unmatched = pd.read_csv(unmatched_stations_file, delimiter=";", encoding="utf-8")
    print(f"Successfully loaded {len(df_unmatched)} unmatched stations.")
except Exception as e:
    print(f"Error loading unmatched stations: {e}")
    exit()

# --- Load Turbopass export ---
print(f"Loading Turbopass export from {turbopass_export_file}...")
try:
    df_turbopass = pd.read_csv(turbopass_export_file, delimiter=",", encoding="utf-8")
    # Clean the station name column
    df_turbopass["name_clean"] = (
        df_turbopass["name"].fillna("").astype(str).str.strip().str.lower()
    )
    print(f"Successfully loaded {len(df_turbopass)} stations from Turbopass.")
except Exception as e:
    print(f"Error loading Turbopass export: {e}")
    exit()

# Prepare turbopass names for matching
turbopass_names_clean = (
    df_turbopass[df_turbopass["name_clean"] != ""]["name_clean"].unique().tolist()
)
turbopass_id_map = df_turbopass.set_index("name_clean")["@id"].to_dict()

# Process unmatched stations in batches
all_validated_matches = []
total_stations = len(df_unmatched)
print(f"Processing {total_stations} unmatched stations in batches of {BATCH_SIZE}")

for batch_start in range(0, total_stations, BATCH_SIZE):
    batch_end = min(batch_start + BATCH_SIZE, total_stations)
    current_batch = df_unmatched.iloc[batch_start:batch_end]

    print(
        f"Processing batch {batch_start // BATCH_SIZE + 1} ({batch_start + 1}-{batch_end} of {total_stations})"
    )

    # Dictionary to store candidates for this batch
    batch_candidates = {}

    # Find top matches for each station in the batch
    for _, station in current_batch.iterrows():
        station_name = station["Serviceeinrichtung"]
        station_name_clean = station["Serviceeinrichtung_clean"]
        station_index = station["Index1"]

        try:
            # Find top 10 potential matches
            potential_matches = process.extract(
                station_name_clean,
                turbopass_names_clean,
                scorer=fuzz.token_sort_ratio,
                limit=10,
            )

            candidates = []

            for matched_name, score in potential_matches:
                try:
                    # Get the corresponding Turbopass ID
                    turbopass_id = turbopass_id_map.get(matched_name)

                    if turbopass_id:
                        # Find the original name
                        original_name = df_turbopass.loc[
                            df_turbopass["@id"] == turbopass_id, "name"
                        ].iloc[0]

                        candidates.append(
                            {
                                "station_index": station_index,
                                "name": original_name,
                                "turbopass_id": turbopass_id,
                                "score": score,
                            }
                        )
                except Exception as e:
                    print(f"Error processing potential match {matched_name}: {e}")

            if candidates:
                batch_candidates[station_name] = candidates
            else:
                print(f"Warning: No potential matches found for '{station_name}'")
        except Exception as e:
            print(f"Error finding potential matches for {station_name}: {e}")

    # Process this batch with Gemini
    batch_results = validate_stations_with_gemini(batch_candidates)
    if batch_results:
        all_validated_matches.extend(batch_results)

# Create DataFrame from validated matches
if all_validated_matches:
    matches_df = pd.DataFrame(all_validated_matches)

    # Print results
    print(f"\nFound {len(matches_df)} validated matches using Gemini API")
    print("\nTop matched stations (by confidence):")
    for _, row in (
        matches_df.sort_values(by="confidence", ascending=False).head(10).iterrows()
    ):
        print(
            f"Confidence: {row['confidence']}% | {row['Serviceeinrichtung_df0']} → {row['name']} | {row['explanation']}"
        )

    # Check if existing file exists and append or create new
    try:
        if os.path.exists(output_file_path):
            # Read existing file
            existing_df = pd.read_csv(output_file_path, delimiter=";", encoding="utf-8")
            print(f"Loaded existing file with {len(existing_df)} records")

            # Append new matches
            combined_df = pd.concat([existing_df, matches_df], ignore_index=True)

            # Save combined file
            combined_df.to_csv(output_file_path, index=False, sep=";", encoding="utf-8")
            print(
                f"\nSuccessfully updated {output_file_path} with {len(matches_df)} new matches"
            )
        else:
            # Create new file
            matches_df.to_csv(output_file_path, index=False, sep=";", encoding="utf-8")
            print(
                f"\nCreated new file {output_file_path} with {len(matches_df)} matches"
            )
    except Exception as e:
        print(f"Error saving matches to file: {e}")
else:
    print("No matches found.")

print("\nScript finished.")
