# CulinaryExpert — Smart Prep for a Healthy Life

A production-ready native mobile application for zero-waste meal planning, precise macro targeting, and batch cooking efficiency.

## Architecture Overview

```
CulinaryExpert/
├── mobile/          React Native (Expo) — iOS & Android app
├── backend/         Node.js / Express API — deployed on Railway
├── database/        Supabase (PostgreSQL) migrations & seeds
├── scripts/         USDA + Open Food Facts data processors
└── docs/            Domain research & design decisions
```

## Tech Stack

| Layer         | Technology                              |
|---------------|----------------------------------------|
| Mobile        | React Native, Expo, TypeScript          |
| Offline Store | MMKV (key-value), WatermelonDB (SQLite) |
| Server Cache  | TanStack Query v5                       |
| Backend API   | Node.js, Express                        |
| Database      | Supabase (PostgreSQL)                   |
| Auth          | Supabase Auth (JWT)                     |
| Charts        | Victory Native                          |
| Deploy        | Railway (backend), EAS Build (mobile)   |

## Setup Instructions

### 1. Prerequisites
- Node.js >= 20
- Python >= 3.10
- Expo CLI: `npm install -g expo-cli eas-cli`
- Supabase account at supabase.com
- Railway account at railway.app

### 2. Supabase Setup
1. Create a new Supabase project
2. Run migrations in order via SQL Editor:
   ```
   database/migrations/001_initial_schema.sql
   database/migrations/002_rls_policies.sql
   database/migrations/003_functions_and_views.sql
   ```
3. Run seed data:
   ```
   database/seeds/seed_sample_recipes.sql
   ```

### 3. USDA + Open Food Facts Data
```bash
cd scripts
pip install -r requirements.txt

# Download SR Legacy CSV from https://fdc.nal.usda.gov/download-datasets.html
python usda_processor.py --data-dir ./usda_data

# Download OFF CSV from https://world.openfoodfacts.org/data
python off_processor.py --csv ./en.openfoodfacts.org.products.csv --limit 100000
```

### 4. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

### 5. Mobile Setup
```bash
cd mobile
npm install
# Create .env file:
echo "EXPO_PUBLIC_API_URL=http://localhost:3000" > .env
npx expo start
```

### 6. Deploy Backend to Railway
```bash
cd backend
railway login
railway init
railway up
```

### 7. Build Mobile App with EAS
```bash
cd mobile
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

## Core Algorithms

### BMR (Mifflin-St Jeor)
```
Men:   BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) + 5
Women: BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161
```

### TDEE
```
TDEE = BMR × Activity Multiplier
Sedentary 1.2 | Light 1.375 | Moderate 1.55 | Active 1.725 | Very Active 1.9
```

### Body Fat (US Navy Formula)
```
Men:   BF% = 86.010 × log10(waist − neck) − 70.041 × log10(height) + 36.76
Women: BF% = 163.205 × log10(waist + hips − neck) − 97.684 × log10(height) − 78.387
```

## App Screens

| Screen | Description |
|--------|-------------|
| Onboarding (6 steps) | Unit selection → Medical disclaimer → Bio data → Measurements → Lifestyle → Health Score |
| Tab 1: Dashboard | Today's macros, Next Meal card, Lifestyle toggles |
| Tab 2: Meal Plan | 7-day horizontal calendar, recipe cards, Loved/Not a fan feedback, link to Groceries |
| Tab 3: Smart Prep | Batch cooking sessions (2×/week), consolidated prep steps, storage guide |
| Tab 4: Groceries | Zero-waste aggregated list, Week/Next Day toggle, supermarket aisle grouping |
| Tab 5: Profile | Editable preferences, measurement history, time-series charts, legal docs |

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Mobile (.env)
```
EXPO_PUBLIC_API_URL=https://your-backend.railway.app
```

## Legal

This app includes:
- **Medical Disclaimer** — required acceptance during onboarding
- **Privacy Policy** — GDPR & CCPA compliant
- **Terms of Service** — standard SaaS terms

See `mobile/src/screens/legal/` for full text.

---

Built with Claude Code · CulinaryExpert v1.0.0
