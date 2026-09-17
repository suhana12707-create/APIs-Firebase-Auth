/*
# Create saved_recipes table

1. New Tables
- `saved_recipes`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user, references auth.users)
  - `meal_id` (text, not null) - TheMealDB recipe ID
  - `meal_name` (text, not null) - Recipe name
  - `meal_thumb` (text, not null) - Recipe thumbnail image URL
  - `category` (text, nullable) - Recipe category
  - `created_at` (timestamp, defaults to now)
2. Security
- Enable RLS on `saved_recipes`.
- Owner-scoped CRUD: each authenticated user can only access their own saved recipes.
- 4 separate policies: select, insert, update, delete — all scoped to `auth.uid() = user_id`.
3. Indexes
- Index on `user_id` for fast per-user queries.
- Unique constraint on (user_id, meal_id) to prevent duplicate saves.
4. Important Notes
- `user_id` defaults to `auth.uid()` so client inserts omitting it still pass the WITH CHECK.
- This is a multi-user app requiring authentication — no anon access.
*/

CREATE TABLE IF NOT EXISTS saved_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_id text NOT NULL,
  meal_name text NOT NULL,
  meal_thumb text NOT NULL,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS saved_recipes_user_meal_unique
  ON saved_recipes (user_id, meal_id);

CREATE INDEX IF NOT EXISTS saved_recipes_user_id_idx
  ON saved_recipes (user_id);

DROP POLICY IF EXISTS "select_own_saved_recipes" ON saved_recipes;
CREATE POLICY "select_own_saved_recipes" ON saved_recipes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_saved_recipes" ON saved_recipes;
CREATE POLICY "insert_own_saved_recipes" ON saved_recipes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_saved_recipes" ON saved_recipes;
CREATE POLICY "update_own_saved_recipes" ON saved_recipes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_saved_recipes" ON saved_recipes;
CREATE POLICY "delete_own_saved_recipes" ON saved_recipes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
