export interface SavedRecipe {
  id: string;
  user_id: string;
  meal_id: string;
  meal_name: string;
  meal_thumb: string;
  category: string | null;
  created_at: string;
}

export interface MealSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
}

export interface MealDetail {
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

export interface Category {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
}
