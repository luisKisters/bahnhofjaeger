# -*- coding: utf-8 -*-
import pandas as pd
import re

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
fuzzy_match_threshold = 90  # Similarity score cutoff (0-100)
fallback_threshold = 80  # Lower threshold for fallback methods (parentheses removal)

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


# Function to get best match considering abbreviations AND parenthetical information
def get_best_match_with_preprocessing(
    query,
    choices,
    abbrev_dict,
    primary_threshold=fuzzy_match_threshold,
    fallback_threshold=fallback_threshold,
):
    match_info = {"best_match": None, "score": 0, "method": ""}

    # Strategy 1: Original matching with abbreviation handling
    best_match_original = process.extractOne(
        query, choices, scorer=fuzz.token_sort_ratio, score_cutoff=primary_threshold
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
            score_cutoff=primary_threshold,
        )

        if best_match_expanded:
            match_info["best_match"] = best_match_expanded
            match_info["score"] = best_match_expanded[1]
            match_info["method"] = "expanded_abbreviations"
            return match_info

    # Strategy 3: Try removing parenthetical information if present
    if "(" in query and ")" in query:
        cleaned_query = remove_parenthetical(query)
        if cleaned_query != query:
            # Try with a lower threshold for this fallback method
            best_match_no_parens = process.extractOne(
                cleaned_query,
                choices,
                scorer=fuzz.token_sort_ratio,
                score_cutoff=fallback_threshold,
            )

            if best_match_no_parens:
                match_info["best_match"] = best_match_no_parens
                match_info["score"] = best_match_no_parens[1]
                match_info["method"] = "removed_parentheses"
                return match_info

            # Try with expanded abbreviations after removing parentheses
            expanded_cleaned_query = expand_abbreviations(cleaned_query, abbrev_dict)
            if expanded_cleaned_query != cleaned_query.lower():
                best_match_expanded_no_parens = process.extractOne(
                    expanded_cleaned_query,
                    choices,
                    scorer=fuzz.token_sort_ratio,
                    score_cutoff=fallback_threshold,
                )

                if best_match_expanded_no_parens:
                    match_info["best_match"] = best_match_expanded_no_parens
                    match_info["score"] = best_match_expanded_no_parens[1]
                    match_info["method"] = "removed_parentheses_and_expanded"
                    return match_info

    # No match found with any method
    return match_info


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
print(
    f"Starting fuzzy matching (threshold: {fuzzy_match_threshold}, fallback threshold: {fallback_threshold})..."
)
fuzzy_matches = []

# Create a mapping from cleaned df1 name back to original df1 rows (using @id as a stable key)
df1_name_map = df1.set_index("name_clean")["@id"].to_dict()

# Dictionary to track match methods
match_methods = {
    "original": 0,
    "expanded_abbreviations": 0,
    "removed_parentheses": 0,
    "removed_parentheses_and_expanded": 0,
}

for index, row_df0 in df0_unmatched.iterrows():
    df0_name_clean = row_df0["Serviceeinrichtung_clean"]

    # Find the best match using our improved function that handles abbreviations and parentheses
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

num_fuzzy_matches = len(fuzzy_matches)
print(
    f"Number of additional stations matched using fuzzy matching: {num_fuzzy_matches}"
)

# Print statistics about match methods
print("\n--- Match Method Statistics ---")
for method, count in match_methods.items():
    if count > 0:
        print(f"- {method}: {count} matches")

# NEW CODE: Display fuzzy matches
if num_fuzzy_matches > 0:
    print("\n--- Fuzzy Matches (sorted by similarity score) ---")
    fuzzy_df = pd.DataFrame(fuzzy_matches)
    # Sort by score in descending order
    fuzzy_df_sorted = fuzzy_df.sort_values(by="score", ascending=False)
    # Display the matches with their scores
    for idx, row in fuzzy_df_sorted.iterrows():
        method_info = (
            f"[{row.get('match_method', 'unknown')}]" if "match_method" in row else ""
        )
        print(
            f'Score: {row["score"]:.1f} {method_info} | Preisliste: "{row["df0_name"]}" → Turbopass: "{row["df1_name_matched"]}"'
        )

# --- Step 7: Combine Exact and Fuzzy Matches ---
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
if num_fuzzy_matches > 0:
    fuzzy_matches_df = pd.DataFrame(fuzzy_matches)
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
        ]
    ].copy()
    fuzzy_matches_final["match_type"] = "fuzzy"
    fuzzy_matches_final.rename(columns={"score": "match_score"}, inplace=True)

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

# --- Step 8: Report Final Results ---
print("\n--- Final Summary ---")
print(f"Total stations in Stationspreisliste (df0): {len(df0)}")
print(f"Total stations in Turbopass export (df1): {len(df1)}")
print(f"Exact matches found: {num_exact_matches}")
print(
    f"Additional fuzzy matches found (threshold {fuzzy_match_threshold}): {num_fuzzy_matches}"
)
print(f"Total matched stations from df0: {total_matched_count}")
print(f"Stations from df0 still unmatched: {remaining_unmatched}")

# NEW CODE: Display unmatched stations
if remaining_unmatched > 0:
    print("\n--- Unmatched Stations from Stationspreisliste ---")
    # Sort by name for easier reading
    final_unmatched_sorted = final_unmatched.sort_values(by="Serviceeinrichtung")
    # Display with relevant information
    for idx, row in final_unmatched_sorted.iterrows():
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

# --- Step 9: Save Combined Results ---
try:
    all_matches_df.to_csv(output_file_path, index=False, sep=";", encoding="utf-8")
    print(f"\nSuccessfully saved combined data to {output_file_path}")
except Exception as e:
    print(f"\nError saving file {output_file_path}: {e}")

print("\nScript finished.")
