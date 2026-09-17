import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Search, Compass } from 'lucide-react-native';
import { searchMeals, getRandomMeals, getCategories, filterByCategory } from '@/lib/mealApi';
import { MealSummary, Category } from '@/types/database';

export default function BrowseScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MealSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const [meals, cats] = await Promise.all([getRandomMeals(12), getCategories()]);
      setResults(meals);
      setCategories(cats.slice(0, 8));
    } catch {
      // network error — keep empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const meals = await getRandomMeals(12);
      setResults(meals);
      setSelectedCategory(null);
      setQuery('');
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (query.trim().length === 0) {
        if (!selectedCategory) loadInitial();
        return;
      }
      try {
        setLoading(true);
        const meals = await searchMeals(query);
        setResults(meals);
        setSelectedCategory(null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [query, selectedCategory, loadInitial]);

  const handleCategoryPress = useCallback(async (category: string) => {
    const newCat = selectedCategory === category ? null : category;
    setSelectedCategory(newCat);
    setQuery('');
    setLoading(true);
    try {
      if (newCat) {
        const meals = await filterByCategory(newCat);
        setResults(meals);
      } else {
        const meals = await getRandomMeals(12);
        setResults(meals);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  const renderRecipe = ({ item }: { item: MealSummary }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => router.push(`/recipe/${item.idMeal}`)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.strMealThumb }} style={styles.recipeImage} />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName} numberOfLines={2}>
          {item.strMeal}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.strCategory && styles.categoryChipActive,
      ]}
      onPress={() => handleCategoryPress(item.strCategory)}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.strCategory && styles.categoryTextActive,
        ]}
      >
        {item.strCategory}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Recipes</Text>
        <Text style={styles.headerSubtitle}>Find your next favorite meal</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.neutral[400]} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a recipe..."
          placeholderTextColor={Colors.neutral[400]}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.idCategory}
        renderItem={renderCategory}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Compass size={48} color={Colors.neutral[300]} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No recipes found</Text>
          <Text style={styles.emptySubtitle}>Try a different search or category</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.idMeal}
          renderItem={renderRecipe}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.recipeList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary[500]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: '700',
    color: Colors.neutral[900],
  },
  headerSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.neutral[500],
    marginTop: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[900],
    paddingVertical: 0,
  },
  categoryList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  categoryChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  categoryText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.neutral[600],
  },
  categoryTextActive: {
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.neutral[600],
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[400],
  },
  recipeList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  row: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  recipeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  recipeImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  recipeInfo: {
    padding: Spacing.sm,
  minHeight: 48,
    justifyContent: 'center',
  },
  recipeName: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.neutral[800],
    lineHeight: 18,
  },
});
