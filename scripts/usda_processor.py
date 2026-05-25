"""
USDA FoodData Central SR Legacy CSV Processor
Downloads, filters, and seeds the Supabase ingredients table.

Usage:
  pip install -r requirements.txt
  python usda_processor.py --data-dir ./usda_data

Download the SR Legacy dataset from:
  https://fdc.nal.usda.gov/download-datasets.html
  -> FoodData Central Download -> SR Legacy -> CSV
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

# USDA nutrient IDs (SR Legacy)
NUTRIENT_IDS = {
    "calories_kcal":  1008,   # Energy (kcal)
    "protein_g":      1003,   # Protein
    "fat_g":          1004,   # Total lipid (fat)
    "carbs_g":        1005,   # Carbohydrate, by difference
    "fiber_g":        1079,   # Fiber, total dietary
    "sugar_g":        2000,   # Total sugars
    "sodium_mg":      1093,   # Sodium, Na
    "iron_mg":        1089,   # Iron, Fe
    "calcium_mg":     1087,   # Calcium, Ca
    "vitamin_c_mg":   1162,   # Vitamin C
    "vitamin_d_mcg":  1114,   # Vitamin D
    "potassium_mg":   1092,   # Potassium, K
}

AISLE_MAP = {
    "Dairy and Egg Products":             "Dairy",
    "Spices and Herbs":                   "Condiments",
    "Baby Foods":                         None,
    "Fats and Oils":                      "Condiments",
    "Poultry Products":                   "Proteins",
    "Soups, Sauces, and Gravies":         "Canned",
    "Sausages and Luncheon Meats":        "Proteins",
    "Breakfast Cereals":                  "Dry Goods",
    "Fruits and Fruit Juices":            "Produce",
    "Pork Products":                      "Proteins",
    "Vegetables and Vegetable Products":  "Produce",
    "Nut and Seed Products":              "Dry Goods",
    "Beef Products":                      "Proteins",
    "Beverages":                          "Other",
    "Finfish and Shellfish Products":     "Proteins",
    "Legumes and Legume Products":        "Dry Goods",
    "Lamb, Veal, and Game Products":      "Proteins",
    "Baked Products":                     "Bakery",
    "Sweets":                             "Other",
    "Cereal Grains and Pasta":            "Dry Goods",
    "Fast Foods":                         None,
    "Meals, Entrees, and Side Dishes":    None,
    "Snacks":                             "Other",
    "American Indian/Alaska Native Foods": None,
    "Restaurant Foods":                   None,
}

ALLERGEN_KEYWORDS = {
    "milk":       ["milk", "dairy", "cheese", "cream", "butter", "whey", "casein", "yogurt"],
    "eggs":       ["egg"],
    "fish":       ["fish", "salmon", "tuna", "cod", "tilapia", "bass", "halibut"],
    "shellfish":  ["shrimp", "crab", "lobster", "clam", "oyster", "scallop", "mussel"],
    "tree_nuts":  ["almond", "cashew", "walnut", "pecan", "pistachio", "macadamia", "hazelnut"],
    "peanuts":    ["peanut"],
    "wheat":      ["wheat", "flour", "bread", "pasta", "semolina"],
    "gluten":     ["wheat", "rye", "barley", "oat"],
    "soy":        ["soy", "soybean", "tofu", "tempeh", "miso", "edamame"],
    "sesame":     ["sesame", "tahini"],
}

def detect_allergens(food_name: str) -> list[str]:
    name_lower = food_name.lower()
    found = []
    for allergen, keywords in ALLERGEN_KEYWORDS.items():
        if any(kw in name_lower for kw in keywords):
            found.append(allergen)
    return found


def load_usda_data(data_dir: Path) -> pd.DataFrame:
    food_path     = data_dir / "food.csv"
    nutrient_path = data_dir / "food_nutrient.csv"
    category_path = data_dir / "food_category.csv"

    if not food_path.exists():
        print(f"ERROR: {food_path} not found. Download SR Legacy CSV from USDA FoodData Central.")
        sys.exit(1)

    print("Loading USDA food.csv ...")
    foods = pd.read_csv(food_path, usecols=["fdc_id", "description", "food_category_id"])

    print("Loading USDA food_category.csv ...")
    categories = pd.read_csv(category_path, usecols=["id", "description"])
    categories = categories.rename(columns={"id": "food_category_id", "description": "category_name"})

    foods = foods.merge(categories, on="food_category_id", how="left")

    print("Loading USDA food_nutrient.csv (this may take a minute) ...")
    nutrients = pd.read_csv(
        nutrient_path,
        usecols=["fdc_id", "nutrient_id", "amount"],
        dtype={"fdc_id": int, "nutrient_id": int, "amount": float},
    )

    target_nutrient_ids = list(NUTRIENT_IDS.values())
    nutrients = nutrients[nutrients["nutrient_id"].isin(target_nutrient_ids)]

    pivot = nutrients.pivot_table(index="fdc_id", columns="nutrient_id", values="amount", aggfunc="first")
    pivot.columns = [f"nut_{c}" for c in pivot.columns]
    pivot = pivot.reset_index()

    merged = foods.merge(pivot, on="fdc_id", how="left")
    return merged


def transform_row(row) -> dict | None:
    category_name = row.get("category_name", "")
    aisle = AISLE_MAP.get(category_name)
    if aisle is None:
        return None  # skip irrelevant categories

    calories = row.get(f"nut_{NUTRIENT_IDS['calories_kcal']}", None)
    if pd.isna(calories) or calories <= 0:
        return None

    name = str(row["description"]).strip()
    if len(name) > 200:
        name = name[:200]

    allergens = detect_allergens(name)
    tags = []
    if calories < 50:  tags.append("low-calorie")
    protein = row.get(f"nut_{NUTRIENT_IDS['protein_g']}", 0) or 0
    if protein >= 20:  tags.append("high-protein")
    fiber = row.get(f"nut_{NUTRIENT_IDS['fiber_g']}", 0) or 0
    if fiber >= 5:     tags.append("high-fiber")
    fat = row.get(f"nut_{NUTRIENT_IDS['fat_g']}", 0) or 0
    carbs = row.get(f"nut_{NUTRIENT_IDS['carbs_g']}", 0) or 0
    if carbs < 5 and fat > 5: tags.append("keto")
    if not allergens:  tags.append("allergen-free")

    def safe_float(val, decimals=3):
        if pd.isna(val): return None
        return round(float(val), decimals)

    return {
        "fdc_id":         int(row["fdc_id"]),
        "name":           name,
        "category":       category_name,
        "calories_kcal":  safe_float(calories, 2),
        "protein_g":      safe_float(row.get(f"nut_{NUTRIENT_IDS['protein_g']}")),
        "fat_g":          safe_float(row.get(f"nut_{NUTRIENT_IDS['fat_g']}")),
        "carbs_g":        safe_float(row.get(f"nut_{NUTRIENT_IDS['carbs_g']}")),
        "fiber_g":        safe_float(row.get(f"nut_{NUTRIENT_IDS['fiber_g']}")),
        "sugar_g":        safe_float(row.get(f"nut_{NUTRIENT_IDS['sugar_g']}")),
        "sodium_mg":      safe_float(row.get(f"nut_{NUTRIENT_IDS['sodium_mg']}"), 2),
        "iron_mg":        safe_float(row.get(f"nut_{NUTRIENT_IDS['iron_mg']}")),
        "calcium_mg":     safe_float(row.get(f"nut_{NUTRIENT_IDS['calcium_mg']}"), 2),
        "vitamin_c_mg":   safe_float(row.get(f"nut_{NUTRIENT_IDS['vitamin_c_mg']}")),
        "vitamin_d_mcg":  safe_float(row.get(f"nut_{NUTRIENT_IDS['vitamin_d_mcg']}")),
        "potassium_mg":   safe_float(row.get(f"nut_{NUTRIENT_IDS['potassium_mg']}"), 2),
        "tags":           tags,
        "allergens":      allergens,
        "supermarket_aisle": aisle,
        "storage_type":   "fridge" if aisle in ("Proteins", "Dairy") else "pantry",
        "common_unit":    "g",
        "grams_per_common_unit": 100.0,
    }


def seed_to_supabase(records: list[dict], client: Client, batch_size: int = 500):
    total   = len(records)
    batches = [records[i:i+batch_size] for i in range(0, total, batch_size)]
    print(f"Seeding {total} ingredients in {len(batches)} batches ...")

    for batch in tqdm(batches, desc="Upserting"):
        resp = client.table("ingredients").upsert(batch, on_conflict="fdc_id").execute()
        if hasattr(resp, "error") and resp.error:
            print(f"  Batch error: {resp.error}")


def main():
    parser = argparse.ArgumentParser(description="USDA FoodData Central → Supabase seeder")
    parser.add_argument("--data-dir", default="./usda_data", help="Directory with USDA CSV files")
    parser.add_argument("--dry-run", action="store_true", help="Parse only, do not upsert")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    df = load_usda_data(data_dir)

    print(f"Processing {len(df)} food records ...")
    records = []
    for _, row in tqdm(df.iterrows(), total=len(df), desc="Transforming"):
        rec = transform_row(row)
        if rec:
            records.append(rec)

    print(f"Valid records after filtering: {len(records)}")

    if args.dry_run:
        print("Dry run — not seeding. First 3 records:")
        for r in records[:3]:
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
