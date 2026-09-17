import { supabase } from '@/lib/supabase';
import { SavedRecipe } from '@/types/database';
import { MealSummary, MealDetail } from '@/types/database';

export async function getSavedRecipes(): Promise<SavedRecipe[]> {
  const { data, error } = await supabase
    .from('saved_recipes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function isRecipeSaved(mealId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('saved_recipes')
    .select('id')
    .eq('meal_id', mealId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data !== null;
}

export async function saveRecipe(meal: MealSummary, category?: string): Promise<void> {
  const { error } = await supabase.from('saved_recipes').insert({
    meal_id: meal.idMeal,
    meal_name: meal.strMeal,
    meal_thumb: meal.strMealThumb,
    category: category ?? null,
  });
  if (error) {
    if (error.code === '23505') return; // already saved — unique constraint
    throw new Error(error.message);
  }
}

export async function unsaveRecipe(mealId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_recipes')
    .delete()
    .eq('meal_id', mealId);
  if (error) throw new Error(error.message);
}

export async function toggleSaveRecipe(
  meal: MealDetail | MealSummary,
  isSaved: boolean,
  category?: string,
): Promise<boolean> {
  if (isSaved) {
    await unsaveRecipe(meal.idMeal);
    return false;
  } else {
    const summary: MealSummary = {
      idMeal: meal.idMeal,
      strMeal: 'strMeal' in meal ? meal.strMeal : '',
      strMealThumb: 'strMealThumb' in meal ? meal.strMealThumb : '',
    };
    await saveRecipe(summary, category);
    return true;
  }
}
