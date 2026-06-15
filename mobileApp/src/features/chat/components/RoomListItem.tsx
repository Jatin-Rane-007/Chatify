import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/refined';
import {
  ChatSurface,
  Radii,
  Spacing,
  Typography,
} from '@/constants/theme';

import type { ChatRoomSummary } from '../services/chatService';

interface RoomListItemProps {
  readonly room: ChatRoomSummary;
  readonly isOnline: boolean;
  readonly onPress: (room: ChatRoomSummary) => void;
}

function formatRelativeTime(iso?: string | null): string {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (sameDay) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function RoomListItemBase({ room, isOnline, onPress }: RoomListItemProps) {
  const name = room.partner?.displayName || room.partner?.username || 'Unknown';
  const lastText = room.lastMessage?.content || 'No messages yet';
  const time = formatRelativeTime(room.lastMessage?.createdAt);
  const unread = room.unreadCount > 0;

  return (
    <Pressable
      onPress={() => onPress(room)}
      android_ripple={{ color: ChatSurface.surfaceRaised }}
      style={({ pressed }) => [
        styles.item,
        pressed && { backgroundColor: ChatSurface.surface },
      ]}
    >
      <Avatar label={name} size={52} tone="tangerine" online={isOnline} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <ThemedText
            style={[styles.name, unread && styles.nameUnread]}
            numberOfLines={1}
          >
            {name}
          </ThemedText>
          <ThemedText
            style={[styles.time, unread && { color: ChatSurface.accent }]}
          >
            {time}
          </ThemedText>
        </View>
        <View style={styles.bottomRow}>
          <ThemedText
            style={[styles.preview, unread && styles.previewUnread]}
            numberOfLines={1}
          >
            {lastText}
          </ThemedText>
          {unread ? (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeLabel}>
                {room.unreadCount > 99 ? '99+' : String(room.unreadCount)}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const RoomListItem = React.memo(RoomListItemBase);

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  body: {
    flex: 1,
    gap: Spacing.one,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    ...Typography.body,
    color: ChatSurface.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  nameUnread: {
    fontWeight: '700',
  },
  time: {
    ...Typography.caption,
    color: ChatSurface.textFaint,
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  preview: {
    ...Typography.caption,
    color: ChatSurface.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  previewUnread: {
    color: ChatSurface.textPrimary,
    fontWeight: '500',
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: Radii.pill,
    backgroundColor: ChatSurface.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
});
