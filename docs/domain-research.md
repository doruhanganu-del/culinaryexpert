# CulinaryExpert — Domain Research

## 1. Culinary Expertise

### Flavor Architecture
- **Maillard reaction** (140–165°C): browning creates hundreds of aroma compounds; critical for recipe tagging as "savory", "umami", or "roasted"
- **Acid-fat-salt-heat balance** (Samin Nosrat's framework): every recipe scored on each axis to auto-suggest adjustments
- **Flavor affinity matrix**: ingredient pairings with known shared volatile compounds inform the recommendation engine (e.g., tomato + basil share linalool)

### Mise en Place Methodology
- Pre-measure, pre-chop, pre-portion before cooking begins
- Translates directly to the Smart Prep Hub: the app mirrors this philosophy at the weekly scale
- Consolidation logic: "chop 4 onions at once" yields ~3× efficiency vs. chopping per-meal

### Food Safety & Storage
- HACCP temperature zones: danger zone 5–60°C; app storage recommendations built around this
- Fridge shelf life matrix (cooked proteins: 3–4 days; blanched vegetables: 5 days; cooked grains: 5 days)
- Freezer shelf life matrix (cooked proteins: 2–3 months; soups/stews: 4–6 months)
- FIFO principle applied to grocery checklist ordering

## 2. Batch Cooking Efficiency

### Cook-Once-Eat-Multiple (COEM)
- Protein anchor: one large protein batch (e.g., 1.5kg chicken breast) reappears as 3 different meals via different sauces/preparations
- Starch foundation: bulk-cook grains (rice, quinoa) every 4 days; reheat in 90 seconds
- "2× prep rule": doubling batch size adds only ~30% prep time — strong argument for batch mode

### Session Structure (twice/week)
- **Session 1 (Sunday):** Proteins + grains + soups for Mon–Wed
- **Session 2 (Wednesday):** Proteins + vegetables + sauces for Thu–Sat
- Algorithm assigns recipes to sessions based on shelf-life and flavor compatibility

### Thermal Sequencing
1. Longest oven items in first (roasted root vegetables: 45 min)
2. Stovetop proteins while oven runs
3. Grains in rice cooker/pot simultaneously
4. Raw prep (chopping) during passive oven time
5. Sauce reduction last (uses residual pan fond)

## 3. Zero-Waste Kitchen Management

### Cross-Utilization Planning
- "Bell pepper problem": 1 recipe uses half a bell pepper → algorithm searches for a second recipe using the other half within the same week
- Aggregation engine merges fractional quantities into whole-purchase amounts
- Surplus tracking: if 20g of ginger remains after a recipe, the next-day suggestion prioritizes ginger-forward recipes

### Supermarket Aisle Categorization
| Aisle | Categories |
|-------|-----------|
| Produce | Fresh vegetables, fresh fruits, herbs |
| Proteins | Meat, poultry, fish, eggs |
| Dairy | Milk, cheese, yogurt, butter |
| Dry Goods | Grains, pasta, legumes, nuts, seeds |
| Canned | Beans, tomatoes, fish, coconut milk |
| Condiments | Oils, vinegars, sauces, spices |
| Frozen | Frozen vegetables, frozen proteins |
| Bakery | Bread, wraps, tortillas |

### Storage Icons & Duration
- **Fridge (🧊):** Short-term (1–5 days), displayed in blue
- **Freezer (❄️):** Long-term (1–6 months), displayed in cyan
- **Pantry (🫙):** Shelf-stable, displayed in amber

## 4. Sports Nutrition & Macronutrient Targeting

### TDEE Calculation
- BMR via Mifflin-St Jeor (implemented exactly as specified)
- Activity multipliers: Sedentary 1.2, Light 1.375, Moderate 1.55, Active 1.725, Very Active 1.9

### Macronutrient Distribution

| Goal | Protein | Carbohydrates | Fat |
|------|---------|---------------|-----|
| Weight Loss | 30–35% | 35–40% | 25–30% |
| Maintenance | 25–30% | 40–45% | 25–30% |
| Hypertrophy (Body Sculpt) | 30–35% | 40–50% | 20–25% |
| Endurance | 20–25% | 50–60% | 20–25% |

### Protein Targets
- **Maintenance:** 0.8g per kg body weight
- **Fat loss (preserve muscle):** 1.6g per kg body weight
- **Hypertrophy (Body Sculpt mode):** 2.0–2.2g per kg lean body mass

### Visual Portion Translations (gram-to-visual)
| Food | Portion | Visual |
|------|---------|--------|
| Cooked chicken breast | 85g | Size of your palm |
| Cooked rice | 180g | 1 cup |
| Broccoli | 150g | 1 fist |
| Olive oil | 14g | 1 tablespoon |
| Nut butter | 32g | 2 tablespoons |
| Cheese | 28g | 4 stacked dice |

### Health Score Algorithm (0–100)
```
score = (
  macro_adherence_score × 0.35 +    -- How close to TDEE targets
  nutrient_density_score × 0.25 +   -- Micronutrient coverage
  body_composition_score × 0.25 +   -- Body fat % vs. healthy range
  variety_score × 0.15              -- Dietary diversity over 7 days
)
```
- Body fat healthy ranges: Men 10–20%, Women 18–28%
- Macro adherence: ±5% = 100 points, ±10% = 75 points, ±20% = 40 points, >20% = 0 points

### Recipe Tagging System
Tags used to filter and rank recipes:
- Dietary: `vegan`, `vegetarian`, `keto`, `paleo`, `gluten-free`, `dairy-free`
- Preparation: `batch-friendly`, `one-pot`, `no-cook`, `meal-prep`
- Timing: `<15min`, `<30min`, `<45min`, `<60min`
- Goal: `high-protein`, `low-carb`, `high-fiber`, `low-sodium`
- Cuisine: `mediterranean`, `asian`, `american`, `mexican`, `italian`
