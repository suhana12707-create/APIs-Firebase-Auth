import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Bookmark, Trash2 } from 'lucide-react-native';
import { getSavedRecipes, unsaveRecipe } from '@/lib/savedRecipes';
import { SavedRecipe } from '@/types/database';

export default function SavedScreen() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecipes = useCallback(async () => {
    setError(null);
    try {
      const data = await getSavedRecipes();
      setRecipes(data);
    } catch {
      setError('Could not load saved recipes. Pull to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [loadRecipes])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecipes();
    setRefreshing(false);
  }, [loadRecipes]);

  const handleRemove = async (mealId: string) => {
    setRecipes((prev) => prev.filter((r) => r.meal_id !== mealId));
    try {
      await unsaveRecipe(mealId);
    } catch {
      // restore on failure
      loadRecipes();
    }
  };

  const renderRecipe = ({ item }: { item: SavedRecipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => router.push(`/recipe/${item.meal_id}`)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.meal_thumb }} style={styles.recipeImage} />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName} numberOfLines={2}>
          {item.meal_name}
        </Text>
        {item.category ? (
          <Text style={styles.recipeCategory}>{item.category}</Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemove(item.meal_id)}
        activeOpacity={0.7}
      >
        <Trash2 size={18} color={Colors.error} strokeWidth={2} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Recipes</Text>
        <Text style={styles.headerSubtitle}>
          {recipes.length > 0
            ? `${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'} saved`
            : 'Your cookbook is waiting'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Bookmark size={48} color={Colors.neutral[300]} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>No saved recipes yet</Text>
          <Text style={styles.emptySubtitle}>
            Browse recipes and tap the bookmark to save them here
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.85}
          >
            <Text style={styles.browseButtonText}>Browse Recipes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={renderRecipe}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.neutral[600],
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[400],
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  browseButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
  },
  errorText: {
    fontSize: Typography.sizes.md,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  recipeList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    alignItems: 'center',
  },
  recipeImage: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
  },
  recipeInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  recipeName: {
    fontSize: Typography.sizes.md,
    fontWeight: '600',
    color: Colors.neutral[800],
    marginBottom: Spacing.xs,
  },
  recipeCategory: {
    fontSize: Typography.sizes.xs,
    color: Colors.neutral[500],
  },
  removeButton: {
    padding: Spacing.md,
  marginRight: Spacing.sm,
  justifyContent: 'center',
    alignItems: 'center',
  },
});
