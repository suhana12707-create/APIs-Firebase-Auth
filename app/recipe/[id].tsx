import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { ArrowLeft, Bookmark, BookmarkCheck, Play, Share2, Clock } from 'lucide-react-native';
import { getMealById } from '@/lib/mealApi';
import { isRecipeSaved, toggleSaveRecipe } from '@/lib/savedRecipes';
import { MealDetail } from '@/types/database';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meal, setMeal] = useState<MealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeal = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMealById(id);
      setMeal(data);
      if (data) {
        const isSaved = await isRecipeSaved(data.idMeal);
        setSaved(isSaved);
      }
    } catch {
      setError('Could not load this recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMeal();
  }, [loadMeal]);

  const handleToggleSave = async () => {
    if (!meal) return;
    setSaving(true);
    try {
      const newSaved = await toggleSaveRecipe(meal, saved, meal.strCategory);
      setSaved(newSaved);
    } catch {
      // ignore for now
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!meal) return;
    try {
      await Share.share({
        message: `Check out this recipe: ${meal.strMeal}`,
      });
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (error || !meal) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error ?? 'Recipe not found.'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: meal.strMealThumb }} style={styles.heroImage} />
        <View style={styles.imageOverlay} />
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <ArrowLeft size={22} color={Colors.white} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <Share2 size={20} color={Colors.white} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleToggleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saved ? (
                <BookmarkCheck size={22} color={Colors.primary[500]} strokeWidth={2} />
              ) : (
                <Bookmark size={22} color={Colors.white} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.mealTitle}>{meal.strMeal}</Text>
          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{meal.strCategory}</Text>
            </View>
            {meal.strArea ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{meal.strArea}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <View style={styles.ingredientList}>
            {meal.ingredients.map((ing, idx) => (
              <View key={idx} style={styles.ingredientRow}>
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientName}>{ing.name}</Text>
                {ing.measure ? (
                  <Text style={styles.ingredientMeasure}>{ing.measure}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructionsText}>{meal.strInstructions}</Text>
        </View>

        {meal.strYoutube ? (
          <TouchableOpacity
            style={styles.youtubeButton}
            onPress={() => Linking.openURL(meal.strYoutube)}
            activeOpacity={0.85}
          >
            <Play size={20} color={Colors.white} strokeWidth={2} />
            <Text style={styles.youtubeText}>Watch on YouTube</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    gap: Spacing.md,
  },
  errorText: {
    fontSize: Typography.sizes.md,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: Typography.sizes.sm,
  },
  imageContainer: {
    position: 'relative',
    height: 320,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  mealTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.neutral[900],
    marginBottom: Spacing.md,
  },
  ingredientList: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    gap: Spacing.sm,
  },
  ingredientBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[400],
  },
  ingredientName: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  ingredientMeasure: {
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[500],
  },
  instructionsText: {
    fontSize: Typography.sizes.md,
    color: Colors.neutral[700],
    lineHeight: 24,
  },
  youtubeButton: {
    flexDirection: 'row',
    backgroundColor: '#FF0000',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  youtubeText: {
    color: Colors.white,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
  },
});
