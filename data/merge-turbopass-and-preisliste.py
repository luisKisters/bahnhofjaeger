# -*- coding: utf-8 -*-
import pandas as pd
import re
import os
import json
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Dict

try:
    import google.generativeai as genai

    GEMINI_AVAILABLE = True
except ImportError:
    print("Warning: Google Generative AI library not found.")
    print("To install it, run: pip install google-generativeai")
    GEMINI_AVAILABLE = False

try:
    from thefuzz import process, fuzz
except ImportError:
    print("Error: 'thefuzz' library not found.")
    print("Please install it using: pip install thefuzz python-Levenshtein")
    exit()  # Exit if the required library is missing

print("Starting station matching script...")

# --- Configuration ---
file0_path = "Stationspreisliste-2025-final.csv"  # Stationspreisliste
file1_path = "turbopass-export.csv"  # Turbopass export
output_file_path = "combined_station_matches.csv"
fuzzy_match_threshold = 93  # Increased similarity score cutoff (0-100)
gemini_threshold = 50  # Very low threshold for collecting candidates for Gemini

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini API if available
if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("Google Gemini AI initialized.")

# --- Add abbreviation dictionary for German station names ---
station_abbreviations = {
    "hbf": "hauptbahnhof",
    "bf": "bahnhof",
    "haltepunkt": "hp",
    "hp": "haltepunkt",
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


# Pydantic model for Gemini structured output - all matches in one request
class StationMappings(BaseModel):
    mappings: List[Dict[str, str]]


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


# Function to get best match considering abbreviations
def get_best_match_with_preprocessing(
    query, choices, abbrev_dict, threshold=fuzzy_match_threshold
):
    match_info = {"best_match": None, "score": 0, "method": ""}

    # Strategy 1: Original matching
    best_match_original = process.extractOne(
        query, choices, scorer=fuzz.token_sort_ratio, score_cutoff=threshold
    )

    if best_match_original:
        match_info["best_match"] = best_match_original
        match_info["score"] = best_match_original[1]
        match_info["method"] = "original"
        return match_info

    # Strategy 2: Try with expanded abbreviations
    expanded_query = expand_abbreviations(query, abbrev_dict)
    if expanded_query != query.lower():
        best_match_expanded = process.extractOne(
            expanded_query,
            choices,
            scorer=fuzz.token_sort_ratio,
            score_cutoff=threshold,
        )

        if best_match_expanded:
            match_info["best_match"] = best_match_expanded
            match_info["score"] = best_match_expanded[1]
            match_info["method"] = "expanded_abbreviations"
            return match_info

    # No match found with standard methods
    return match_info


# Function to validate all station matches in a single Gemini call
def validate_all_stations_with_gemini(all_candidates):
    """
    Use Gemini AI to determine correct matches for all unmatched stations in a single request.

    Args:
        all_candidates: Dict with preisliste station names as keys and lists of potential matches as values

    Returns:
        List of validated matches
    """
    if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
        print("Skipping Gemini validation - Gemini AI not available")
        return []

    # Skip if no potential matches
    if not all_candidates:
        return []

    print(f"Preparing Gemini request for {len(all_candidates)} stations...")

    # Limit to 50 stations for API practicality
    station_keys = list(all_candidates.keys())[:50]
    limited_candidates = {k: all_candidates[k] for k in station_keys}

    # Format all the stations and their potential matches for the prompt
    stations_text = ""

    for i, (station_name, candidates) in enumerate(limited_candidates.items()):
        candidates_text = "\n".join(
            [
                f"    {j + 1}. '{match['name']}' (score: {match['score']})"
                for j, match in enumerate(candidates[:5])
            ]
        )  # Limit to top 5 candidates

        stations_text += f"Station {i + 1}: '{station_name}'\nPossible matches:\n{candidates_text}\n\n"

    prompt = f"""Match German railway station names from Stationspreisliste with the correct names from Turbopass.

{stations_text}

INSTRUCTIONS:
- For each station, identify which candidate is the correct match (if any)
- Consider abbreviations (Hbf = Hauptbahnhof), spelling variants (ä/ae, ß/ss), and different naming conventions
- Only include stations where you can determine a correct match with high confidence

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

                # Print the first 500 characters of the response for debugging
                print(f"Response preview: {text_content[:500]}...")

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
                                match_idx = item.get("correct_match_index", 0) - 1
                                correct_match_name = item.get("correct_match_name", "")

                                print(
                                    f"Processing match for station {station_id}: {preisliste_name} -> {correct_match_name} (index {match_idx})"
                                )

                                # Find the station in all_candidates either by ID or name
                                if station_id.isdigit() and int(station_id) <= len(
                                    limited_candidates
                                ):
                                    station_key = list(limited_candidates.keys())[
                                        int(station_id) - 1
                                    ]
                                    print(f"Using station_id to find: {station_key}")
                                else:
                                    station_key = preisliste_name
                                    print(
                                        f"Using preisliste_name to find: {station_key}"
                                    )

                                if (
                                    station_key in limited_candidates
                                    and 0
                                    <= match_idx
                                    < len(limited_candidates[station_key])
                                ):
                                    match = limited_candidates[station_key][match_idx]
                                    validated_results.append(
                                        {
                                            "df0_Index1": match["df0_Index1"],
                                            "df0_name": station_key,
                                            "df1_id": match["df1_id"],
                                            "df1_name_matched": match["name"],
                                            "score": match["score"],
                                            "match_method": "gemini_validated",
                                            "explanation": item.get("explanation", ""),
                                        }
                                    )
                                    print(
                                        f"Gemini validated match: '{station_key}' → '{match['name']}' (explanation: {item.get('explanation', 'No explanation')})"
                                    )
                                else:
                                    print(
                                        f"Match index out of range or station key not found: {station_key}, idx={match_idx}"
                                    )
                                    if station_key in limited_candidates:
                                        print(
                                            f"  Available indices: 0-{len(limited_candidates[station_key]) - 1}"
                                        )
                                    else:
                                        print(f"  Station key not found in candidates")
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
        else:
            print("No text property in Gemini response")

        print(f"Total validated matches: {len(validated_results)}")
        return validated_results

    except Exception as e:
        print(f"Error calling Gemini API: {str(e)}")
        return []


# --- Step 1: Load Stationspreisliste (df0) ---
print(f"Loading {file0_path}...")
try:
    col_names_df0 = [
        "Index1",
        "Code",
        "Serviceeinrichtung",
        "Category",
        "State",
        "Price_SPNV",
        "Price_SPFV",
        "Bemerkung",
    ]
    df0 = pd.read_csv(
        file0_path,
        delimiter=";",
        header=None,
        names=col_names_df0,
        skiprows=1,  # Skip the original header row
        quotechar='"',
        skipinitialspace=True,
        encoding="utf-8",  # Specify encoding if necessary
    )
    # Clean the station name column
    df0["Serviceeinrichtung_clean"] = df0["Serviceeinrichtung"].str.strip().str.lower()
    print(f"Successfully loaded {len(df0)} rows from {file0_path}.")
except FileNotFoundError:
    print(f"Error: File not found at {file0_path}")
    exit()
except Exception as e:
    print(f"Error loading {file0_path}: {e}")
    exit()

# --- Step 2: Load Turbopass Export (df1) ---
print(f"Loading {file1_path}...")
try:
    df1 = pd.read_csv(
        file1_path,
        delimiter=",",
        encoding="utf-8",  # Specify encoding if necessary
    )
    # Clean the station name column and handle potential NaN values before cleaning
    df1["name_clean"] = df1["name"].fillna("").astype(str).str.strip().str.lower()
    print(f"Successfully loaded {len(df1)} rows from {file1_path}.")
except FileNotFoundError:
    print(f"Error: File not found at {file1_path}")
    exit()
except Exception as e:
    print(f"Error loading {file1_path}: {e}")
    exit()

# --- Step 3: Perform Exact Merge ---
print("Performing exact match...")
merged_df = pd.merge(
    df1,
    df0,
    left_on="name_clean",  # Use cleaned names for exact matching
    right_on="Serviceeinrichtung_clean",
    how="inner",
    suffixes=(
        "_df1",
        "_df0",
    ),  # Suffixes to distinguish columns from original dataframes if needed
)
num_exact_matches = len(merged_df)
print(f"Found {num_exact_matches} exact matches.")

# --- Step 4: Identify Unmatched df0 Stations ---
# Fix: Use 'Index1' instead of 'Index1_df0' since it may not have a suffix if no column conflict
matched_df0_indices = merged_df["Index1"].unique()  # Fixed line
df0_unmatched = df0[~df0["Index1"].isin(matched_df0_indices)].copy()
num_unmatched_initially = len(df0_unmatched)
print(f"Number of stations in df0 initially unmatched: {num_unmatched_initially}")

# For testing with a smaller dataset, limit to first N unmatched stations
# Comment this line for production use with all stations
# df0_unmatched = df0_unmatched.head(10)  # Process only first 10 for testing

# --- Step 5: Prepare df1 Names for Fuzzy Matching ---
# Use unique, non-null cleaned names from df1
df1_names_clean_list = df1[df1["name_clean"] != ""]["name_clean"].unique().tolist()
if not df1_names_clean_list:
    print("Error: No valid station names found in df1 for fuzzy matching.")
    exit()
print(
    f"Number of unique station names in df1 to search against for fuzzy matching: {len(df1_names_clean_list)}"
)

# --- Step 6: Perform Fuzzy Matching ---
print(f"Starting fuzzy matching (threshold: {fuzzy_match_threshold})...")
fuzzy_matches = []
not_matched = []  # Keep track of unmatched stations for Gemini

# Create a mapping from cleaned df1 name back to original df1 rows (using @id as a stable key)
df1_name_map = df1.set_index("name_clean")["@id"].to_dict()

# Dictionary to track match methods
match_methods = {"original": 0, "expanded_abbreviations": 0, "gemini_validated": 0}

for index, row_df0 in df0_unmatched.iterrows():
    df0_name_clean = row_df0["Serviceeinrichtung_clean"]
    df0_name = row_df0["Serviceeinrichtung"]
    df0_index = row_df0["Index1"]

    # Find the best match using our improved function that handles abbreviations
    match_result = get_best_match_with_preprocessing(
        df0_name_clean, df1_names_clean_list, station_abbreviations
    )

    if match_result["best_match"]:
        best_match = match_result["best_match"]
        matched_df1_name_clean = best_match[0]
        score = best_match[1]
        method = match_result["method"]

        # Track which method was successful
        match_methods[method] += 1

        # Get the corresponding df1 @id using the map
        matched_df1_id = df1_name_map.get(matched_df1_name_clean)

        if matched_df1_id:
            # Find the original name from df1 using the @id
            original_df1_name = df1.loc[df1["@id"] == matched_df1_id, "name"].iloc[0]

            fuzzy_matches.append(
                {
                    "df0_Index1": row_df0["Index1"],  # Use original index from df0
                    "df0_name": row_df0["Serviceeinrichtung"],
                    "df1_id": matched_df1_id,
                    "df1_name_matched": original_df1_name,  # Matched name from df1
                    "score": score,
                    "match_method": method,  # Store the method used for matching
                }
            )
        else:
            print(
                f"Warning: Could not find original df1 entry for cleaned name '{matched_df1_name_clean}'"
            )
    else:
        # If not matched using fuzzy methods, add to not_matched list for Gemini
        not_matched.append(row_df0)

num_fuzzy_matches = len(fuzzy_matches)
print(
    f"Number of additional stations matched using fuzzy matching: {num_fuzzy_matches}"
)
print(f"Number of stations not matched with fuzzy methods: {len(not_matched)}")

# --- Step 7: Process unmatched stations with Gemini AI ---
print("\n--- Processing all unmatched stations with Gemini AI ---")
gemini_matches = []

if GEMINI_AVAILABLE and GEMINI_API_KEY and not_matched:
    # Process stations in manageable batches
    BATCH_SIZE = 10  # Process 10 stations per Gemini call

    total_stations = len(not_matched)
    print(f"Processing {total_stations} unmatched stations in batches of {BATCH_SIZE}")

    # Process stations in batches
    for batch_start in range(0, total_stations, BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, total_stations)
        current_batch = not_matched[batch_start:batch_end]

        print(
            f"Processing batch {batch_start // BATCH_SIZE + 1} ({batch_start + 1}-{batch_end} of {total_stations})"
        )

        # Dictionary to store all potential matches for all unmatched stations in this batch
        batch_gemini_candidates = {}

        # Get potential matches for all unmatched stations in this batch
        for unmatched_row in current_batch:
            df0_name_clean = unmatched_row["Serviceeinrichtung_clean"]
            df0_name = unmatched_row["Serviceeinrichtung"]
            df0_index = unmatched_row["Index1"]

            try:
                # Get top 5 potential matches for each station
                potential_matches = process.extract(
                    df0_name_clean,
                    df1_names_clean_list,
                    scorer=fuzz.token_sort_ratio,
                    limit=5,  # Get top 5 matches per station
                )

                candidates = []

                for matched_name, score in potential_matches:
                    try:
                        # Get the corresponding df1 @id using the map
                        matched_df1_id = df1_name_map.get(matched_name)

                        if matched_df1_id:
                            # Find the original name from df1 using the @id
                            df1_subset = df1.loc[df1["@id"] == matched_df1_id]
                            if not df1_subset.empty:
                                original_df1_name = df1_subset["name"].iloc[0]

                                candidates.append(
                                    {
                                        "df0_Index1": df0_index,
                                        "name": original_df1_name,
                                        "df1_id": matched_df1_id,
                                        "score": score,
                                    }
                                )
                    except Exception as e:
                        print(f"Error processing potential match {matched_name}: {e}")

                if candidates:
                    batch_gemini_candidates[df0_name] = candidates
                else:
                    print(f"Warning: No potential matches found for '{df0_name}'")
            except Exception as e:
                print(f"Error finding potential matches for {df0_name}: {e}")

        num_candidates = len(batch_gemini_candidates)
        print(
            f"Found {num_candidates} stations in this batch with potential matches to validate"
        )

        # Process this batch with Gemini
        if num_candidates > 0:
            batch_validated_matches = validate_all_stations_with_gemini(
                batch_gemini_candidates
            )
            if batch_validated_matches:
                print(
                    f"Batch validation successful: {len(batch_validated_matches)} matches found"
                )
                gemini_matches.extend(batch_validated_matches)
            else:
                print("No matches validated in this batch")

# Update count of Gemini-validated matches
match_methods["gemini_validated"] = len(gemini_matches)

num_gemini_matches = len(gemini_matches)
print(f"Additional matches validated by Gemini AI: {num_gemini_matches}")

# Combine all fuzzy matches
all_fuzzy_matches = fuzzy_matches + gemini_matches
num_all_fuzzy_matches = len(all_fuzzy_matches)

# Print statistics about match methods
print("\n--- Match Method Statistics ---")
for method, count in match_methods.items():
    if count > 0:
        print(f"- {method}: {count} matches")

# NEW CODE: Display fuzzy matches
if num_all_fuzzy_matches > 0:
    print("\n--- Fuzzy Matches (sorted by similarity score) ---")
    fuzzy_df = pd.DataFrame(all_fuzzy_matches)
    # Sort by score in descending order
    fuzzy_df_sorted = fuzzy_df.sort_values(by="score", ascending=False)
    # Display the matches with their scores (limit to 50 for readability)
    display_count = min(50, len(fuzzy_df_sorted))
    print(f"Showing top {display_count} of {len(fuzzy_df_sorted)} fuzzy matches:")
    for idx, row in fuzzy_df_sorted.head(display_count).iterrows():
        method_info = (
            f"[{row.get('match_method', 'unknown')}]" if "match_method" in row else ""
        )
        print(
            f'Score: {row["score"]:.1f} {method_info} | Preisliste: "{row["df0_name"]}" → Turbopass: "{row["df1_name_matched"]}"'
        )

# --- Step 8: Combine Exact and Fuzzy Matches ---
print("\nCombining exact and fuzzy matches...")

# Prepare exact matches dataframe for combination
# Select necessary columns and rename for consistency
# Fix: Use column names without assuming _df0 suffix
exact_matches_final = merged_df[
    [
        "@id",
        "name",
        "@lat",
        "@lon",
        "railway",
        "public_transport",  # df1 columns
        "Index1",  # Fixed: removed _df0 suffix
        "Code",  # Fixed: removed _df0 suffix
        "Serviceeinrichtung",  # Fixed: removed _df0 suffix
        "Category",  # Fixed: removed _df0 suffix
        "State",  # Fixed: removed _df0 suffix
        "Price_SPNV",  # Fixed: removed _df0 suffix
        "Price_SPFV",  # Fixed: removed _df0 suffix
        "Bemerkung",  # Fixed: removed _df0 suffix
    ]
].copy()
exact_matches_final["match_type"] = "exact"
exact_matches_final["match_score"] = 100  # Score for exact matches

# Prepare fuzzy matches dataframe for combination
if num_all_fuzzy_matches > 0:
    fuzzy_matches_df = pd.DataFrame(all_fuzzy_matches)
    # Merge fuzzy matches with df0 details
    fuzzy_df0_part = pd.merge(
        fuzzy_matches_df, df0, left_on="df0_Index1", right_on="Index1", how="left"
    )
    # Merge with df1 details
    fuzzy_combined = pd.merge(
        fuzzy_df0_part,
        df1,
        left_on="df1_id",
        right_on="@id",
        how="left",
        suffixes=("_fuzzy_df0", "_df1"),
    )

    # Select necessary columns and rename for consistency
    fuzzy_matches_final = fuzzy_combined[
        [
            "@id",
            "name",
            "@lat",
            "@lon",
            "railway",
            "public_transport",  # df1 columns
            "Index1",
            "Code",
            "Serviceeinrichtung",
            "Category",
            "State",
            "Price_SPNV",
            "Price_SPFV",
            "Bemerkung",  # df0 columns
            "score",  # Fuzzy score
            "match_method",  # Method used for matching
        ]
    ].copy()
    fuzzy_matches_final["match_type"] = "fuzzy"
    fuzzy_matches_final.rename(
        columns={"score": "match_score", "match_method": "match_subtype"}, inplace=True
    )

    # Align column names before concatenation
    cols_rename_map = {
        "Index1": "Index1_df0",
        "Code": "Code_df0",
        "Serviceeinrichtung": "Serviceeinrichtung_df0",
        "Category": "Category_df0",
        "State": "State_df0",
        "Price_SPNV": "Price_SPNV_df0",
        "Price_SPFV": "Price_SPFV_df0",
        "Bemerkung": "Bemerkung_df0",
    }
    # Apply renaming for exact matches
    exact_matches_final.rename(columns=cols_rename_map, inplace=True)
    # Apply same renaming for fuzzy matches
    fuzzy_matches_final.rename(columns=cols_rename_map, inplace=True)

    # Concatenate
    all_matches_df = pd.concat(
        [exact_matches_final, fuzzy_matches_final], ignore_index=True
    )

    # Identify all matched Index1 values from both exact and fuzzy matches
    all_matched_indices = all_matches_df["Index1_df0"].unique()
    # Get unmatched stations as those not in the combined matches
    final_unmatched = df0[~df0["Index1"].isin(all_matched_indices)].copy()

else:
    # If no fuzzy matches, the final result is just the exact matches
    cols_rename_map = {
        "Index1": "Index1_df0",
        "Code": "Code_df0",
        "Serviceeinrichtung": "Serviceeinrichtung_df0",
        "Category": "Category_df0",
        "State": "State_df0",
        "Price_SPNV": "Price_SPNV_df0",
        "Price_SPFV": "Price_SPFV_df0",
        "Bemerkung": "Bemerkung_df0",
    }
    exact_matches_final.rename(
        columns=cols_rename_map, inplace=True
    )  # Rename for consistency
    all_matches_df = exact_matches_final

    # Identify unmatched stations
    all_matched_indices = all_matches_df["Index1_df0"].unique()
    final_unmatched = df0[~df0["Index1"].isin(all_matched_indices)].copy()

total_matched_count = len(all_matches_df)
remaining_unmatched = len(final_unmatched)

# --- Step 9: Report Final Results ---
print("\n--- Final Summary ---")
print(f"Total stations in Stationspreisliste (df0): {len(df0)}")
print(f"Total stations in Turbopass export (df1): {len(df1)}")
print(f"Exact matches found: {num_exact_matches}")
print(f"Additional fuzzy matches found: {num_fuzzy_matches}")
print(f"Additional matches validated by Gemini: {num_gemini_matches}")
print(f"Total matched stations from df0: {total_matched_count}")
print(f"Stations from df0 still unmatched: {remaining_unmatched}")

# NEW CODE: Display unmatched stations
if remaining_unmatched > 0:
    print("\n--- Unmatched Stations from Stationspreisliste ---")
    # Sort by name for easier reading
    final_unmatched_sorted = final_unmatched.sort_values(by="Serviceeinrichtung")
    # Display with relevant information (limit to 50 for readability)
    display_count = min(50, len(final_unmatched_sorted))
    print(
        f"Showing {display_count} of {len(final_unmatched_sorted)} unmatched stations:"
    )
    for idx, row in final_unmatched_sorted.head(display_count).iterrows():
        state = row["State"] if pd.notna(row["State"]) else ""
        code = row["Code"] if pd.notna(row["Code"]) else ""
        print(f"{row['Serviceeinrichtung']} | Code: {code} | State: {state}")

    # Option to save unmatched to a file
    unmatched_file_path = "unmatched_stations.csv"
    try:
        final_unmatched_sorted.to_csv(
            unmatched_file_path, index=False, sep=";", encoding="utf-8"
        )
        print(f"\nUnmatched stations saved to {unmatched_file_path}")
    except Exception as e:
        print(f"\nError saving unmatched stations file: {e}")

# --- Step 10: Save Combined Results ---
try:
    all_matches_df.to_csv(output_file_path, index=False, sep=";", encoding="utf-8")
    print(f"\nSuccessfully saved combined data to {output_file_path}")
except Exception as e:
    print(f"\nError saving file {output_file_path}: {e}")

print("\nScript finished.")
