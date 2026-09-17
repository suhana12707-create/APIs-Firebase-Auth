import { MealSummary, MealDetail, Category } from '@/types/database';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

async function apiFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  const data = await response.json();
  return data as T;
}

export async function searchMeals(query: string): Promise<MealSummary[]> {
  if (!query.trim()) return [];
  const data = await apiFetch<{ meals: MealSummary[] | null }>(`/search.php?s=${encodeURIComponent(query)}`);
  return data.meals ?? [];
}

export async function getMealById(id: string): Promise<MealDetail | null> {
  const data = await apiFetch<{ meals: MealDetail[] | null }>(`/lookup.php?i=${id}`);
  if (!data.meals || data.meals.length === 0) return null;
  return parseMealDetail(data.meals[0]);
}

export async function getRandomMeals(count: number = 10): Promise<MealSummary[]> {
  const promises = Array.from({ length: count }, () =>
    apiFetch<{ meals: MealSummary[] }>(`/random.php`)
  );
  const results = await Promise.all(promises);
  const seen = new Set<string>();
  return results
    .map((r) => r.meals[0])
    .filter((m) => {
      if (seen.has(m.idMeal)) return false;
      seen.add(m.idMeal);
      return true;
    });
}

export async function getCategories(): Promise<Category[]> {
  const data = await apiFetch<{ categories: Category[] }>(`/categories.php`);
  return data.categories ?? [];
}

export async function filterByCategory(category: string): Promise<MealSummary[]> {
  const data = await apiFetch<{ meals: MealSummary[] | null }>(`/filter.php?c=${encodeURIComponent(category)}`);
  return data.meals ?? [];
}

function parseMealDetail(raw: any): MealDetail {
  const ingredients: { name: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = raw[`strIngredient${i}`];
    const measure = raw[`strMeasure${i}`];
    if (name && name.trim()) {
      ingredients.push({ name: name.trim(), measure: (measure || '').trim() });
    }
  }
  return {
    idMeal: raw.idMeal,
    strMeal: raw.strMeal,
    strCategory: raw.strCategory,
    strArea: raw.strArea,
    strInstructions: raw.strInstructions,
    strMealThumb: raw.strMealThumb,
    strYoutube: raw.strYoutube,
    strSource: raw.strSource ?? null,
    ingredients,
  };
}
