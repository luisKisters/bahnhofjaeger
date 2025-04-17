# this script requires https://www.dbinfrago.com/resource/blob/13076748/ec6b9d78f9aaef7867edcd719c403f3b/Stationspreisliste-2025-data.pdf in the utils folder
# cd data
# python3 -m venv pdfenv
# source pdfenv/bin/activate
# pip install 'camelot-py[cv]' pandas openpyxl

import camelot
import pandas as pd
import os
import sys
import re  # Import regular expressions for header cleaning

# --- Configuration ---
pdf_path = (
    "Stationspreisliste-2025-data.pdf"  # Make sure this PDF is in the same folder
)
output_csv_path = "Stationspreisliste_2025_extracted2.csv"
# --- End Configuration ---


# Define the IDEAL final headers in the desired order and format
IDEAL_HEADERS = [
    "bf_nr",
    "aufgabentraeger",
    "bahnhof",
    "preisklasse",
    "bundesland",
    "preis_spnv",
    "preis_spfv",
    "bemerkung",
]
# --- End Configuration ---


def clean_header(header_list):
    """Cleans a list of header names."""
    cleaned = []
    for h in header_list:
        h_str = str(h).replace("\n", " ").strip()  # Remove newlines and whitespace
        h_str = re.sub(r"\s+", "_", h_str)  # Replace spaces with underscores
        h_str = h_str.lower()  # Convert to lowercase
        # Specific known header variations mapping
        h_str = h_str.replace("bf-nr", "bf_nr")
        h_str = h_str.replace("preis-klasse", "preisklasse")
        h_str = h_str.replace(
            "stationspreis_spnv_-_anteil_serviceeinrichtung", "preis_spnv"
        )
        h_str = h_str.replace(
            "stationspreis_spfv_-_anteil_serviceeinrichtung", "preis_spfv"
        )
        cleaned.append(h_str)
    return cleaned


def correct_row_shift(row, num_expected_cols):
    """
    Detects and corrects rows where the first column (bf_nr) is missing,
    causing subsequent columns to shift left.
    """
    # Heuristic: If the 'preisklasse' column (expected index 3) contains non-numeric
    # data that isn't obviously a price class number, assume the row is shifted.
    # We need to be careful as 'Preisklasse' itself is numeric. Check if it *can* be numeric.
    try:
        # Check if the value in the *expected* preisklasse position (index 3)
        # can be converted to a number. If not, it's likely shifted.
        potential_preisklasse = str(row.iloc[3]).strip()
        pd.to_numeric(
            potential_preisklasse
        )  # This will raise ValueError if not numeric
        # If it IS numeric, the row is likely NOT shifted OR Preisklasse is missing
        # A further check could be added here if needed (e.g., check col 4 for Bundesland text)
        is_shifted = False

    except (ValueError, IndexError):
        # If conversion fails OR index 3 doesn't exist, assume it's shifted
        is_shifted = True
    except Exception:
        # Catch other potential errors, assume shifted
        is_shifted = True

    if is_shifted:
        # Create a new list with NaN at the beginning
        corrected_values = [pd.NA] + row.iloc[0 : num_expected_cols - 1].tolist()
        # Ensure the new list has the correct number of columns
        while len(corrected_values) < num_expected_cols:
            corrected_values.append(pd.NA)
        # Create a new Series with the corrected values and original index names
        return pd.Series(corrected_values[:num_expected_cols], index=row.index)
    else:
        # Row seems correctly aligned or has missing data later, return as is
        return row


def extract_clean_save(pdf_filepath, csv_output_path, final_headers):
    """
    Extracts, attempts to correct alignment, cleans, and saves table data.
    """
    if not os.path.exists(pdf_filepath):
        print(f"Error: PDF file not found at '{pdf_filepath}'")
        sys.exit(1)

    print(f"Reading PDF: {pdf_filepath} (This might take a while)...")
    try:
        tables = camelot.read_pdf(
            pdf_filepath,
            pages="all",
            flavor="lattice",
            strip_text=" \n.€",  # Remove common clutter chars
            line_scale=40,
        )
    except Exception as e:
        print(f"Error reading PDF with Camelot: {e}")
        print("Ensure Ghostscript is installed and accessible. See Camelot docs.")
        sys.exit(1)

    print(f"Found {tables.n} tables across all pages.")
    if tables.n == 0:
        print("No tables found.")
        return

    all_data_dfs = []
    # Try to get the header from the first table for temporary assignment
    # Assume first table has the most reliable header structure for now
    first_table_df = tables[0].df
    temp_header = None

    # Simple header detection for first table (can be refined as before if needed)
    if len(first_table_df) > 1:
        temp_header = clean_header(first_table_df.iloc[0].tolist())
        # Use only the first row as data for now, skipping header
        # We'll combine all tables then fix headers/shifts
        # all_data_dfs.append(first_table_df.iloc[1:]) # Old approach
    # else: # Handle empty first table case if necessary
    #     pass

    # Extract data from ALL tables, temporarily skipping first row as likely header
    print("Extracting raw data (skipping first row per table)...")
    for i, table in enumerate(tables):
        df = table.df
        if len(df) > 1:
            all_data_dfs.append(df.iloc[1:])  # Skip first row
        elif len(df) == 1 and i > 0:  # Single row table on later pages might be data
            all_data_dfs.append(df.iloc[0:])

    if not all_data_dfs:
        print("No data extracted after skipping headers.")
        return

    print("Concatenating raw data...")
    raw_df = pd.concat(all_data_dfs, ignore_index=True)

    # --- Column Alignment Correction ---
    print("Attempting to correct column alignment based on 'preisklasse' position...")
    num_expected_cols = len(final_headers)

    # Ensure the raw_df has *at least* enough columns to attempt correction
    # Pad with NA if necessary (can happen if Camelot finds fewer columns on some pages)
    while raw_df.shape[1] < num_expected_cols:
        raw_df[f"extra_col_{raw_df.shape[1]}"] = pd.NA
        print(f"Warning: Padded raw DataFrame to {raw_df.shape[1]} columns.")

    # Assign temporary numerical headers for apply function
    raw_df.columns = range(raw_df.shape[1])

    # Apply the correction function row by row
    # Make sure to handle cases where raw_df might have *more* cols than expected initially
    corrected_df = raw_df.apply(
        correct_row_shift, axis=1, num_expected_cols=num_expected_cols
    )

    # Assign the IDEAL headers
    if corrected_df.shape[1] >= num_expected_cols:
        # Take only the expected number of columns before assigning headers
        corrected_df = corrected_df.iloc[:, :num_expected_cols]
        corrected_df.columns = final_headers
        print(f"Assigned final headers: {final_headers}")
    else:
        print(
            f"Warning: Corrected DataFrame has {corrected_df.shape[1]} cols, expected {num_expected_cols}. Headers may be incorrect."
        )
        corrected_df.columns = final_headers[
            : corrected_df.shape[1]
        ]  # Assign partial headers

    # --- Final Data Cleaning ---
    print("Performing final data cleaning...")

    # 1. Remove rows that are obviously repeated headers
    if "bahnhof" in corrected_df.columns:  # Check if a common header exists
        original_rows = len(corrected_df)
        # More robust check: remove rows where 'bahnhof' column literally contains 'Bahnhof'
        corrected_df = corrected_df[
            ~corrected_df["bahnhof"]
            .astype(str)
            .str.contains("Bahnhof", case=False, na=False)
        ]
        rows_removed = original_rows - len(corrected_df)
        if rows_removed > 0:
            print(f"Removed {rows_removed} suspected repeated header rows.")

    # 2. Clean price columns (remove ' €', replace ',' with '.', convert to numeric)
    price_cols = ["preis_spnv", "preis_spfv"]
    for col in price_cols:
        if col in corrected_df.columns:
            try:
                corrected_df[col] = corrected_df[col].astype(str)  # Ensure string type
                corrected_df[col] = (
                    corrected_df[col].str.replace("€", "", regex=False).str.strip()
                )
                corrected_df[col] = corrected_df[col].str.replace(",", ".", regex=False)
                corrected_df[col] = pd.to_numeric(corrected_df[col], errors="coerce")
            except Exception as e:
                print(f"Warning: Could not fully clean price column '{col}': {e}")

    # 3. Strip leading/trailing whitespace from all object (likely string) columns
    for col in corrected_df.select_dtypes(include=["object"]).columns:
        if col in corrected_df.columns:  # Check column exists
            corrected_df[col] = corrected_df[col].astype(str).str.strip()

    # --- Save to CSV ---
    print(f"Saving cleaned data to: {csv_output_path}")
    try:
        corrected_df.to_csv(csv_output_path, index=False, encoding="utf-8-sig")
        print("Successfully created cleaned CSV file.")
    except Exception as e:
        print(f"Error saving CSV file: {e}")


# --- Run the extraction and cleaning ---
if __name__ == "__main__":
    extract_clean_save(pdf_path, output_csv_path, IDEAL_HEADERS)
