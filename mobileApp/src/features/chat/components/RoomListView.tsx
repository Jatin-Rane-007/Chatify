import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Avatar, EmptyState, Fab, IconButton } from '@/components/ui/refined';
import {
  BottomTabInset,
  ChatSurface,
  MaxContentWidth,
  Radii,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useChatRooms } from '@/features/chat/hooks/useChatRooms';
import { usePresence } from '@/features/chat/hooks/usePresence';
import { useAuthStore } from '@/stores/auth-store';

import type { ChatRoomSummary } from '../services/chatService';
import { RoomListItem } from './RoomListItem';

interface RoomListViewProps {
  readonly onOpen: (room: ChatRoomSummary) => void;
  readonly onNewChat?: () => void;
  readonly onOpenSettings?: () => void;
}

export function RoomListView({ onOpen, onNewChat, onOpenSettings }: RoomListViewProps) {
  const { rooms, loading, error, refresh } = useChatRooms();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const partnerIds = useMemo(
    () => rooms.map((r) => r.partner?.id).filter((id): id is string => Boolean(id)),
    [rooms],
  );
  const presence = usePresence(partnerIds);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) => {
      const name = (r.partner?.displayName || r.partner?.username || '').toLowerCase();
      return name.includes(q);
    });
  }, [rooms, query]);

  const handle = user?.displayName || user?.username || user?.email?.split('@')[0] || '?';

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable onPress={onOpenSettings} hitSlop={8}>
            <Avatar label={handle} size={36} tone="tangerine" />
          </Pressable>
          <ThemedText style={styles.title}>Chats</ThemedText>
          <View style={styles.headerActions}>
            <IconButton
              label="🔍"
              size={40}
              onPress={() => setSearchOpen((v) => !v)}
            />
          </View>
        </View>

        {searchOpen ? (
          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search chats"
              placeholderTextColor={ChatSurface.textFaint}
              style={styles.search}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBar}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}

        {loading && rooms.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={ChatSurface.accent} size="large" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => (
              <RoomListItem
                room={item}
                isOnline={item.partner ? !!presence[item.partner.id] : false}
                onPress={onOpen}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={refresh}
            ListEmptyComponent={
              <EmptyState
                icon="💬"
                title="No chats yet"
                body="Tap the + button to start a new conversation."
              />
            }
          />
        )}

        {onNewChat ? <Fab icon="+" onPress={onNewChat} /> : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ChatSurface.background },
  safe: { flex: 1, maxWidth: MaxContentWidth, alignSelf: 'stretch', width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
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
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  searchWrap: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    backgroundColor: ChatSurface.inputBg,
    borderRadius: Radii.xxl,
    paddingHorizontal: Spacing.four,
    minHeight: 44,
    justifyContent: 'center',
  },
  search: {
    ...Typography.body,
    color: ChatSurface.textPrimary,
    paddingVertical: 0,
  },
  errorBar: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    backgroundColor: ChatSurface.danger,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.md,
  },
  errorText: {
    ...Typography.bodyBold,
    color: ChatSurface.textPrimary,
    fontSize: 13,
  },
  list: {
    paddingBottom: BottomTabInset + Spacing.six,
    flexGrow: 1,
  },
  sep: { height: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
