import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Avatar, EmptyState, IconButton } from '@/components/ui/refined';
import {
  BottomTabInset,
  ChatSurface,
  Radii,
  Spacing,
  Typography,
} from '@/constants/theme';

interface MockCall {
  readonly id: string;
  readonly name: string;
  readonly type: 'incoming' | 'outgoing' | 'missed';
  readonly kind: 'voice' | 'video';
  readonly when: string;
}

// Placeholder mock data — backend integration tracked in docs/MOBILE_BACKEND_TODO.md
const mockCalls: readonly MockCall[] = [];

export default function CallsScreen() {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Calls</ThemedText>
          <IconButton label="⌕" onPress={() => undefined} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Pressable
            style={styles.actionRow}
            android_ripple={{ color: ChatSurface.surfaceRaised }}
          >
            <View style={styles.actionIcon}>
              <ThemedText style={styles.actionIconLabel}>🔗</ThemedText>
            </View>
            <View style={styles.actionBody}>
              <ThemedText style={styles.actionTitle}>Create call link</ThemedText>
              <ThemedText style={styles.actionHint}>
                Share a link for your call
              </ThemedText>
            </View>
          </Pressable>

          <ThemedText style={styles.sectionLabel}>Recent</ThemedText>

          {mockCalls.length === 0 ? (
            <EmptyState
              icon="📞"
              title="No recent calls"
              body="Start a call from any chat to see your call history here."
            />
          ) : (
            <View>
              {mockCalls.map((call) => (
                <View key={call.id} style={styles.callRow}>
                  <Avatar label={call.name} size={48} tone="surface" />
                  <View style={styles.callBody}>
                    <ThemedText style={styles.callName}>{call.name}</ThemedText>
                    <ThemedText style={styles.callMeta}>
                      {call.type} · {call.when}
                    </ThemedText>
                  </View>
                  <IconButton
                    label={call.kind === 'video' ? '📹' : '📞'}
                    onPress={() => undefined}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ChatSurface.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  title: {
    ...Typography.heading,
    color: ChatSurface.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  scroll: {
    paddingBottom: BottomTabInset + Spacing.six,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: Radii.pill,
    backgroundColor: ChatSurface.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconLabel: {
    fontSize: 22,
  },
  actionBody: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    ...Typography.body,
    color: ChatSurface.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  actionHint: {
    ...Typography.caption,
    color: ChatSurface.textSecondary,
    fontSize: 13,
  },
  sectionLabel: {
    ...Typography.bodyBold,
    color: ChatSurface.textPrimary,
    fontSize: 14,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  callBody: {
    flex: 1,
    gap: 2,
  },
  callName: {
    ...Typography.body,
    color: ChatSurface.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  callMeta: {
    ...Typography.caption,
    color: ChatSurface.textSecondary,
    fontSize: 13,
  },
});
