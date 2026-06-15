import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/refined';
import {
  BottomTabInset,
  ChatSurface,
  Palette,
  Radii,
  Spacing,
  Typography,
} from '@/constants/theme';

/**
 * Updates tab — WhatsApp-style. UI only.
 * Backend: Statuses, channel posts, and seen-state are stubbed.
 * See docs/MOBILE_BACKEND_TODO.md.
 */
export default function UpdatesScreen() {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Updates</ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText style={styles.sectionLabel}>Status</ThemedText>

          <Pressable style={styles.myStatus} android_ripple={{ color: ChatSurface.surfaceRaised }}>
            <View style={styles.myAvatarWrap}>
              <Avatar label="You" size={52} tone="tangerine" />
              <View style={styles.plusBadge}>
                <ThemedText style={styles.plusLabel}>+</ThemedText>
              </View>
            </View>
            <View style={styles.statusBody}>
              <ThemedText style={styles.statusName}>My status</ThemedText>
              <ThemedText style={styles.statusHint}>Tap to add status update</ThemedText>
            </View>
          </Pressable>

          <ThemedText style={[styles.sectionLabel, styles.sectionGap]}>
            Recent updates
          </ThemedText>

          <View style={styles.emptyBlock}>
            <ThemedText style={styles.emptyTitle}>No recent updates</ThemedText>
            <ThemedText style={styles.emptyBody}>
              Updates from people you chat with will appear here.
            </ThemedText>
          </View>

          <ThemedText style={[styles.sectionLabel, styles.sectionGap]}>Channels</ThemedText>
          <View style={styles.emptyBlock}>
            <ThemedText style={styles.emptyTitle}>Stay updated</ThemedText>
            <ThemedText style={styles.emptyBody}>
              Find channels to follow — coming soon.
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ChatSurface.background },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  title: {
    ...Typography.heading,
    color: ChatSurface.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  scroll: {
    paddingBottom: BottomTabInset + Spacing.six,
  },
  sectionLabel: {
    ...Typography.bodyBold,
    color: ChatSurface.textPrimary,
    fontSize: 14,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  sectionGap: {
    paddingTop: Spacing.four,
  },
  myStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  myAvatarWrap: {
    position: 'relative',
  },
  plusBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ChatSurface.accent,
    borderWidth: 2,
    borderColor: ChatSurface.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusLabel: {
    color: Palette.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  statusBody: {
    flex: 1,
    gap: 2,
  },
  statusName: {
    ...Typography.body,
    color: ChatSurface.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  statusHint: {
    ...Typography.caption,
    color: ChatSurface.textSecondary,
    fontSize: 13,
  },
  emptyBlock: {
    marginHorizontal: Spacing.four,
    padding: Spacing.four,
    backgroundColor: ChatSurface.surface,
    borderRadius: Radii.xl,
    gap: Spacing.two,
  },
  emptyTitle: {
    ...Typography.bodyBold,
    color: ChatSurface.textPrimary,
    fontSize: 15,
  },
  emptyBody: {
    ...Typography.caption,
    color: ChatSurface.textSecondary,
    fontSize: 13,
  },
});
