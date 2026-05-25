"""
Open Food Facts CSV Processor
Downloads and seeds branded/packaged food data into the Supabase ingredients table.

Usage:
  python off_processor.py --csv ./en.openfoodfacts.org.products.csv

Download the CSV from:
  https://world.openfoodfacts.org/data
  -> en.openfoodfacts.org.products.csv.gz
  Then: gunzip en.openfoodfacts.org.products.csv.gz
"""

import argparse
import os
import sys
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm

load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

OFF_COLUMNS = [
    "code", "product_name", "categories_en", "countries_en",
    "energy-kcal_100g", "proteins_100g", "carbohydrates_100g",
    "fat_100g", "fiber_100g", "sugars_100g", "sodium_100g",
    "iron_100g", "calcium_100g", "vitamin-c_100g", "potassium_100g",
    "allergens_en",
]

AISLE_KEYWORD_MAP = {
    "Produce":    ["fruit", "vegetable", "fresh", "salad"],
    "Proteins":   ["meat", "fish", "poultry", "chicken", "beef", "pork", "seafood", "salmon", "tuna"],
    "Dairy":      ["dairy", "milk", "cheese", "yogurt", "cream", "butter"],
    "Dry Goods":  ["grain", "cereal", "pasta", "rice", "legume", "bean", "nut", "seed"],
    "Canned":     ["canned", "preserved", "tinned"],
    "Bakery":     ["bread", "bakery", "pastry", "cookie", "biscuit"],
    "Condiments": ["sauce", "oil", "vinegar", "spice", "condiment"],
    "Frozen":     ["frozen"],
    "Beverages":  ["beverage", "drink", "juice", "water", "coffee", "tea"],
}

MIN_REQUIRED_FIELDS = {"energy-kcal_100g", "proteins_100g", "carbohydrates_100g", "fat_100g"}


def guess_aisle(categories: str) -> str:
    if pd.isna(categories):
        return "Other"
    cat_lower = categories.lower()
    for aisle, keywords in AISLE_KEYWORD_MAP.items():
        if any(kw in cat_lower for kw in keywords):
            return aisle
    return "Other"


def parse_allergens(allergens_str: str) -> list[str]:
    if pd.isna(allergens_str):
        return []
    raw = allergens_str.lower().replace("en:", "")
    known = ["milk", "eggs", "fish", "shellfish", "tree_nuts", "peanuts", "wheat", "soy", "sesame", "gluten"]
    found = []
    for a in known:
        alt = a.replace("_", " ")
        if a in raw or alt in raw:
            found.append(a)
    return found


def transform_off_row(row) -> dict | None:
    name = str(row.get("product_name", "")).strip()
    if not name or len(name) < 2:
        return None

    # Must have at least calories
    cal = row.get("energy-kcal_100g")
    if pd.isna(cal) or float(cal) <= 0:
        return None

    # Filter to English/US products mostly
    countries = str(row.get("countries_en", "")).lower()
    if countries and "united states" not in countries and "united kingdom" not in countries and "en:" not in countries:
        if len(countries) > 0 and "france" in countries:  # skip purely French entries
            return None

    barcode = str(row.get("code", "")).strip()
    if not barcode or barcode == "nan":
        return None

    def sf(val, dec=3):
        if pd.isna(val): return None
        try: return round(float(val), dec)
        except: return None

    aisle = guess_aisle(row.get("categories_en"))
    allergens = parse_allergens(row.get("allergens_en"))

    tags = []
    protein = sf(row.get("proteins_100g")) or 0
    fiber   = sf(row.get("fiber_100g")) or 0
    carbs   = sf(row.get("carbohydrates_100g")) or 0
    fat     = sf(row.get("fat_100g")) or 0
    if protein >= 20: tags.append("high-protein")
    if fiber   >= 5:  tags.append("high-fiber")
    if carbs   < 5 and fat > 5: tags.append("keto")
    if not allergens: tags.append("allergen-free")

    return {
        "off_barcode":       barcode[:50],
        "name":              name[:200],
        "category":          str(row.get("categories_en", ""))[:100],
        "calories_kcal":     sf(cal, 2),
        "protein_g":         sf(row.get("proteins_100g")),
        "fat_g":             sf(row.get("fat_100g")),
        "carbs_g":           sf(row.get("carbohydrates_100g")),
        "fiber_g":           sf(row.get("fiber_100g")),
        "sugar_g":           sf(row.get("sugars_100g")),
        "sodium_mg":         sf(row.get("sodium_100g"), 2),
        "iron_mg":           sf(row.get("iron_100g")),
        "calcium_mg":        sf(row.get("calcium_100g"), 2),
        "vitamin_c_mg":      sf(row.get("vitamin-c_100g")),
        "potassium_mg":      sf(row.get("potassium_100g"), 2),
        "tags":              tags,
        "allergens":         allergens,
        "supermarket_aisle": aisle,
        "storage_type":      "fridge" if aisle in ("Proteins", "Dairy") else "pantry",
        "common_unit":       "g",
        "grams_per_common_unit": 100.0,
    }


def seed_to_supabase(records: list[dict], client: Client, batch_size: int = 500):
    total   = len(records)
    batches = [records[i:i+batch_size] for i in range(0, total, batch_size)]
    print(f"Seeding {total} OFF ingredients in {len(batches)} batches ...")

    for batch in tqdm(batches, desc="Upserting"):
        resp = client.table("ingredients").upsert(batch, on_conflict="off_barcode").execute()
        if hasattr(resp, "error") and resp.error:
            print(f"  Batch error: {resp.error}")


def main():
    parser = argparse.ArgumentParser(description="Open Food Facts CSV → Supabase seeder")
    parser.add_argument("--csv",     default="./en.openfoodfacts.org.products.csv")
    parser.add_argument("--limit",   type=int, default=50000, help="Max rows to process (OFF CSV has 3M+)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        print(f"ERROR: {csv_path} not found.")
        sys.exit(1)

    print(f"Reading {csv_path} (first {args.limit} rows) ...")
    chunks = []
    reader = pd.read_csv(
        csv_path,
        sep="\t",
        usecols=lambda c: c in OFF_COLUMNS,
        nrows=args.limit,
        low_memory=False,
        on_bad_lines="skip",
    )
    df = reader if isinstance(reader, pd.DataFrame) else pd.concat(chunks)

    print(f"Transforming {len(df)} rows ...")
    records = []
    for _, row in tqdm(df.iterrows(), total=len(df), desc="Transforming"):
        rec = transform_off_row(row)
        if rec:
            records.append(rec)

    print(f"Valid records: {len(records)}")

    if args.dry_run:
        print("Dry run complete. Sample:")
        for r in records[:2]:
            print(r)
        return

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env")
        sys.exit(1)

    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    seed_to_supabase(records, client)
    print("Done.")


if __name__ == "__main__":
    main()
