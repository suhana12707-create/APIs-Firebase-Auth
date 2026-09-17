import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { User, Mail, LogOut, ChefHat, Info, Shield } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          await signOut();
          setLoading(false);
          router.replace('/(auth)/signin');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <User size={40} color={Colors.white} strokeWidth={2} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileEmail}>{user?.email ?? 'Unknown'}</Text>
          <Text style={styles.profileLabel}>Signed in</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Mail size={20} color={Colors.primary[500]} strokeWidth={2} />
          </View>
          <Text style={styles.menuText}>Email</Text>
          <Text style={styles.menuValue} numberOfLines={1}>
            {user?.email ?? '—'}
          </Text>
        </View>
        <View style={styles.menuDivider} />
        <View style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Shield size={20} color={Colors.secondary[500]} strokeWidth={2} />
          </View>
          <Text style={styles.menuText}>User ID</Text>
          <Text style={styles.menuValue} numberOfLines={1}>
            {user?.id?.slice(0, 8) ?? '—'}...
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <ChefHat size={20} color={Colors.accent[500]} strokeWidth={2} />
          </View>
          <Text style={styles.menuText}>Recipe Explorer</Text>
          <Text style={styles.menuValue}>v1.0.0</Text>
        </View>
        <View style={styles.menuDivider} />
        <View style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Info size={20} color={Colors.neutral[400]} strokeWidth={2} />
          </View>
          <Text style={styles.menuText}>Data Source</Text>
          <Text style={styles.menuValue}>TheMealDB API</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.signOutButton, loading && styles.signOutDisabled]}
        onPress={handleSignOut}
        disabled={loading}
        activeOpacity={0.85}
      >
        <LogOut size={20} color={Colors.error} strokeWidth={2} />
        <Text style={styles.signOutText}>
          {loading ? 'Signing out...' : 'Sign Out'}
        </Text>
      </TouchableOpacity>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    gap: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileEmail: {
    fontSize: Typography.sizes.md,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginBottom: Spacing.xs,
  },
  profileLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[500],
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.neutral[500],
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    gap: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  menuValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[400],
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
    marginHorizontal: Spacing.md,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: Spacing.sm,
  },
  signOutDisabled: {
    opacity: 0.5,
  },
  signOutText: {
    fontSize: Typography.sizes.md,
    fontWeight: '700',
    color: Colors.error,
  },
});
