# Recipe Explorer — Backend Configuration & Documentation

## Overview

Recipe Explorer is a mobile cloud app that demonstrates REST API consumption, user authentication, and cloud database storage. It uses **TheMealDB** (a free REST API) for recipe data and **Supabase** (a Firebase alternative) for authentication and database persistence.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Mobile App (Expo)               │
│                                                  │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │
│  │  Browse   │  │  Saved    │  │   Profile    │ │
│  │  Recipes  │  │  Recipes  │  │   & Auth     │ │
│  └─────┬─────┘  └─────┬─────┘  └──────┬───────┘ │
│        │              │               │          │
│  ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴───────┐  │
│  │ mealApi   │  │savedRecipes│  │  AuthContext │  │
│  │ (REST)    │  │ (Supabase) │  │  (Supabase)  │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬───────┘  │
└────────┼───────────────┼──────────────┼─────────┘
         │               │               │
    ┌────▼────┐   ┌──────▼──────┐  ┌────▼──────┐
    │TheMealDB│   │  Supabase   │  │ Supabase  │
    │ REST API│   │  Database   │  │   Auth    │
    └─────────┘   └─────────────┘  └───────────┘
```

## 1. REST API Integration (TheMealDB)

The app consumes the free [TheMealDB API](https://www.themealdb.com/api.php) for all recipe data.

### Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/search.php?s={query}` | GET | Search recipes by name |
| `/lookup.php?i={id}` | GET | Get full recipe details by ID |
| `/random.php` | GET | Get a random recipe |
| `/categories.php` | GET | List all meal categories |
| `/filter.php?c={category}` | GET | Filter recipes by category |

### Implementation

All API calls are in `lib/mealApi.ts`. The service:
- Uses native `fetch` for HTTP requests
- Parses JSON responses and validates structure before returning
- Handles null/empty results gracefully
- Extracts up to 20 ingredients/measurements from the flat JSON structure

### Data Models

```typescript
interface MealSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
}

interface MealDetail {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strYoutube: string;
  strSource: string | null;
  ingredients: { name: string; measure: string }[];
}

interface Category {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
}
```

## 2. Authentication (Supabase Auth)

### Configuration

Authentication uses Supabase's built-in email/password auth. No custom auth tables are used — Supabase manages the `auth.users` table internally.

**Environment Variables** (pre-configured in `.env`):
- `EXPO_PUBLIC_SUPABASE_URL` — Project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Anonymous API key

### Auth Flow

1. **Sign Up**: User provides email + password → `supabase.auth.signUp()` creates account and session
2. **Sign In**: User provides email + password → `supabase.auth.signInWithPassword()` authenticates
3. **Session Persistence**: Supabase client persists session via web localStorage
4. **Auth State**: `AuthContext` wraps the app, listens to `onAuthStateChange`, and gates navigation
5. **Sign Out**: `supabase.auth.signOut()` clears session, redirects to sign-in

### Security

- Email confirmation is OFF (users can sign in immediately after sign-up)
- Passwords require minimum 6 characters (validated client-side)
- Session token stored securely via Supabase client
- Protected routes redirect unauthenticated users to sign-in

### Auth Context (`contexts/AuthContext.tsx`)

```typescript
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email, password) => Promise<{ error: string | null }>;
  signUp: (email, password) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}
```

## 3. Cloud Database Storage (Supabase PostgreSQL)

### Collection Structure

#### `saved_recipes` Table

Stores user's bookmarked recipes from TheMealDB.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NOT NULL | `auth.uid()` | Owner (FK to auth.users) |
| `meal_id` | text | NOT NULL | — | TheMealDB recipe ID |
| `meal_name` | text | NOT NULL | — | Recipe name |
| `meal_thumb` | text | NOT NULL | — | Thumbnail image URL |
| `category` | text | NULL | — | Recipe category |
| `created_at` | timestamptz | NOT NULL | `now()` | Save timestamp |

### Indexes

- `saved_recipes_user_meal_unique` — UNIQUE on `(user_id, meal_id)` — prevents duplicate saves
- `saved_recipes_user_id_idx` — on `user_id` — fast per-user queries

### Security Validation Schema (RLS Policies)

Row Level Security is enabled. Four policies enforce owner-only access:

| Policy | Command | Role | Condition |
|--------|---------|------|-----------|
| `select_own_saved_recipes` | SELECT | authenticated | `auth.uid() = user_id` |
| `insert_own_saved_recipes` | INSERT | authenticated | `WITH CHECK: auth.uid() = user_id` |
| `update_own_saved_recipes` | UPDATE | authenticated | `USING + WITH CHECK: auth.uid() = user_id` |
| `delete_own_saved_recipes` | DELETE | authenticated | `USING: auth.uid() = user_id` |

**Key security properties:**
- `user_id` defaults to `auth.uid()` so inserts succeed even when the client omits the field
- Foreign key to `auth.users` with `ON DELETE CASCADE` — deleting a user removes their data
- Unique constraint prevents saving the same recipe twice
- Unauthenticated users cannot read, write, or modify any data
- Users can only access their own saved recipes — never another user's

### Data Access Layer (`lib/savedRecipes.ts`)

All database operations go through typed helper functions:
- `getSavedRecipes()` — fetch user's saved recipes, newest first
- `isRecipeSaved(mealId)` — check if a recipe is already saved
- `saveRecipe(meal, category?)` — insert a new saved recipe
- `unsaveRecipe(mealId)` — delete a saved recipe
- `toggleSaveRecipe(meal, isSaved, category?)` — toggle save state

## 4. Firebase vs Supabase

This project uses Supabase instead of Firebase because:
- Supabase provides equivalent auth, database, and storage capabilities
- Works seamlessly with Expo's web platform (no native build required)
- PostgreSQL with Row Level Security offers fine-grained access control
- Pre-provisioned in the Bolt environment — no manual setup needed

The architecture maps directly to Firebase equivalents:
- Supabase Auth ↔ Firebase Authentication
- Supabase PostgreSQL ↔ Cloud Firestore
- `saved_recipes` table ↔ Firestore collection
- RLS policies ↔ Firestore Security Rules

## 5. File Structure

```
app/
├── _layout.tsx              # Root layout with AuthProvider
├── (auth)/
│   ├── _layout.tsx           # Auth gate — redirects to tabs if signed in
│   ├── signin.tsx            # Sign-in screen
│   └── signup.tsx            # Sign-up screen
├── (tabs)/
│   ├── _layout.tsx           # Tab navigation (Browse, Saved, Profile)
│   ├── index.tsx             # Browse recipes with search + categories
│   ├── saved.tsx             # Saved recipes list
│   └── profile.tsx           # User profile + sign out
└── recipe/
    └── [id].tsx              # Recipe detail screen

contexts/
└── AuthContext.tsx           # Auth state provider

lib/
├── supabase.ts               # Supabase client singleton
├── mealApi.ts                # TheMealDB REST API service
└── savedRecipes.ts           # Supabase database access layer

types/
├── database.ts               # TypeScript interfaces for data models
└── env.d.ts                  # Environment variable type declarations

constants/
└── theme.ts                  # Color system, spacing, typography
```
