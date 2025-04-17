# this script requires https://www.dbinfrago.com/resource/blob/13076748/ec6b9d78f9aaef7867edcd719c403f3b/Stationspreisliste-2025-data.pdf in the utils folder
# cd data
# python3 -m venv pdfenv
# source pdfenv/bin/activate
# pip install 'camelot-py[cv]' pandas openpyxl

import camelot
import pandas as pd
import os
import sys

# --- Configuration ---
pdf_path = (
    "Stationspreisliste-2025-data.pdf"  # Make sure this PDF is in the same folder
)
output_csv_path = "Stationspreisliste_2025_extracted.csv"
# --- End Configuration ---


def extract_and_combine_tables(pdf_filepath, csv_output_path):
    """
    Extracts tables from all pages of a PDF using Camelot and combines them
    into a single CSV file, handling repeated headers.
    """
    if not os.path.exists(pdf_filepath):
        print(f"Error: PDF file not found at '{pdf_filepath}'")
        sys.exit(1)

    print(f"Reading PDF: {pdf_filepath} (This might take a while)...")
    try:
        # Use 'lattice' as the PDF seems to have lines defining cells
        # strip_text helps remove extra whitespace and newline characters
        tables = camelot.read_pdf(
            pdf_filepath,
            pages="all",
            flavor="lattice",  # Use 'stream' if 'lattice' fails or tables have no lines
            strip_text=" \n.€",  # Characters to strip from text, added '.' and '€'
            line_scale=40,  # May need adjustment if lines are missed
            # copy_text=['v'] # Might help with vertical text alignment if needed
        )
    except Exception as e:
        print(f"Error reading PDF with Camelot: {e}")
        print(
            "Camelot might require Ghostscript. Please ensure it's installed and in your system's PATH."
        )
        print(
            "Installation instructions: https://camelot-py.readthedocs.io/en/master/user/install-deps.html"
        )
        sys.exit(1)

    print(f"Found {tables.n} tables across all pages.")

    if tables.n == 0:
        print("No tables found in the PDF.")
        return

    all_data_dfs = []
    header_row = None

    # Process tables page by page
    for i, table in enumerate(tables):
        print(f"Processing table {i + 1}/{tables.n}...")
        df = table.df

        # --- Smart Header Detection ---
        # Try to find the row that looks like the actual header
        potential_header_idx = -1
        # Define expected header keywords (adjust if needed based on PDF)
        header_keywords = [
            "BfNr",
            "Aufgabenträger",
            "Bahnhof",
            "Preisklasse",
            "Bundesland",
            "SPNV",
            "SPFV",
            "Bemerkung",
        ]

        for idx, row in df.iterrows():
            # Check if a significant number of keywords are in the row's values
            matches = sum(
                keyword.lower() in str(cell).lower()
                for keyword in header_keywords
                for cell in row.values
            )
            # Heuristic: if more than half the keywords match, it's likely the header
            if matches >= len(header_keywords) // 2 + 1:
                potential_header_idx = idx
                break  # Found the most likely header

        if potential_header_idx != -1:
            # If this is the first table where we found a header, store it
            if header_row is None:
                header_row = df.iloc[potential_header_idx].tolist()
                print(f"Detected header on page {i + 1}: {header_row}")

            # Get data rows *after* the detected header
            data_df = df.iloc[potential_header_idx + 1 :]
            all_data_dfs.append(data_df)
        elif i == 0 and len(df) > 1:
            # Fallback for the first page if smart detection fails: assume row 1 is header
            print(
                f"Warning: Smart header detection failed on page {i + 1}. Assuming row 1 is header."
            )
            header_row = df.iloc[0].tolist()  # Use the first row as header
            data_df = df.iloc[1:]
            all_data_dfs.append(data_df)
        elif i > 0 and len(df) > 0:
            # For subsequent pages, if header wasn't found, assume first row is a *repeated* header and skip it
            print(
                f"Warning: Smart header detection failed on page {i + 1}. Skipping first row assuming it's a repeated header."
            )
            data_df = df.iloc[1:]  # Skip the likely repeated header row
            all_data_dfs.append(data_df)
        else:
            print(
                f"Warning: Could not process table {i + 1} properly (no header found or empty). Skipping."
            )

    if not all_data_dfs:
        print("No valid data extracted from tables.")
        return

    print("Concatenating data from all pages...")
    # Combine all extracted data DataFrames
    final_df = pd.concat(all_data_dfs, ignore_index=True)

    # --- Assign Correct Headers ---
    if header_row and len(header_row) == len(final_df.columns):
        # Clean header names slightly (remove excessive spaces/newlines)
        cleaned_header = [str(h).replace("\n", " ").strip() for h in header_row]
        # Rename specific headers for clarity based on PDF visual
        header_map = {
            "Stationspreis SPNV - Anteil Serviceeinrichtung": "Preis_SPNV",
            "Stationspreis SPFV - Anteil Serviceeinrichtung": "Preis_SPFV",
            "Preis- klasse": "Preisklasse",  # Fix potential newline issue
            # Add other specific renaming if needed
        }
        final_header = [header_map.get(h, h) for h in cleaned_header]

        # Make sure the number of columns match before assigning header
        if len(final_header) == len(final_df.columns):
            final_df.columns = final_header
            print("Assigned final headers.")
        else:
            print(
                f"Warning: Header length ({len(final_header)}) doesn't match DataFrame columns ({len(final_df.columns)}). Using default numbered columns."
            )

    else:
        print(
            "Warning: Could not determine consistent headers. Using default numbered columns."
        )

    # --- Data Cleaning (Optional but Recommended) ---
    # Example: Remove rows that might be repeated headers mistakenly included
    if "BfNr" in final_df.columns:  # Check if header assignment worked
        original_rows = len(final_df)
        # Remove rows where 'BfNr' column literally contains 'BfNr' (case-insensitive)
        final_df = final_df[
            ~final_df["BfNr"].astype(str).str.contains("BfNr", case=False, na=False)
        ]
        rows_removed = original_rows - len(final_df)
        if rows_removed > 0:
            print(f"Removed {rows_removed} suspected repeated header rows from data.")

    # Example: Clean price columns (remove ' €', replace ',' with '.')
    price_cols = ["Preis_SPNV", "Preis_SPFV"]
    for col in price_cols:
        if col in final_df.columns:
            try:
                # Convert to string first to ensure .str methods work
                final_df[col] = final_df[col].astype(str)
                # Remove currency symbol and whitespace
                final_df[col] = (
                    final_df[col].str.replace("€", "", regex=False).str.strip()
                )
                # Replace comma decimal separator with dot
                final_df[col] = final_df[col].str.replace(",", ".", regex=False)
                # Attempt conversion to numeric, coercing errors to NaN (Not a Number)
                final_df[col] = pd.to_numeric(final_df[col], errors="coerce")
                print(f"Cleaned price column: {col}")
            except Exception as e:
                print(f"Warning: Could not fully clean price column '{col}': {e}")

    # --- Save to CSV ---
    print(f"Saving combined data to: {csv_output_path}")
    try:
        # Use utf-8-sig encoding for better Excel compatibility with special chars
        final_df.to_csv(csv_output_path, index=False, encoding="utf-8-sig")
        print("Successfully created CSV file.")
    except Exception as e:
        print(f"Error saving CSV file: {e}")


# --- Run the extraction ---
if __name__ == "__main__":
    extract_and_combine_tables(pdf_path, output_csv_path)
