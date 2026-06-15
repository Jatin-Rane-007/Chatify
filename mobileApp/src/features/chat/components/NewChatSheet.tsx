import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/refined';
import {
  ChatSurface,
  Palette,
  Radii,
  Spacing,
  Typography,
} from '@/constants/theme';
import { chatService, type UserSearchResult } from '@/features/chat/services/chatService';

interface NewChatSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onChatStarted?: (chatRoomId: string, user: UserSearchResult) => void;
}

export function NewChatSheet({ visible, onClose, onChatStarted }: NewChatSheetProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setMessage(null);
    }
  }, [visible]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setMessage(null);
      try {
        const data = await chatService.searchUsers(q);
        setResults(data);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const [starting, setStarting] = useState<string | null>(null);

  const handleStartChat = async (user: UserSearchResult) => {
    setMessage(null);
    setStarting(user.id);
    try {
      const { chatRoomId } = await chatService.startDirectChat(user.id);
      onChatStarted?.(chatRoomId, user);
      onClose();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to start chat');
    } finally {
      setStarting(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={10}>
              <ThemedText style={styles.cancel}>Cancel</ThemedText>
            </Pressable>
            <ThemedText style={styles.title}>New chat</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or @username"
              placeholderTextColor={ChatSurface.textFaint}
              style={styles.search}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>

          {message ? (
            <View style={styles.banner}>
              <ThemedText style={styles.bannerLabel}>{message}</ThemedText>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={ChatSurface.accent} />
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(u) => u.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => {
                const name = item.displayName || item.username || 'Unknown';
                return (
                  <Pressable
                    onPress={() => void handleStartChat(item)}
                    disabled={starting === item.id}
                    android_ripple={{ color: ChatSurface.surfaceRaised }}
                    style={({ pressed }) => [
                      styles.userItem,
                      pressed && { backgroundColor: ChatSurface.surface },
                    ]}
                  >
                    <Avatar label={name} size={48} tone="tangerine" />
                    <View style={styles.userBody}>
                      <ThemedText style={styles.userName} numberOfLines={1}>
                        {name}
                      </ThemedText>
                      {item.username ? (
                        <ThemedText style={styles.userHandle} numberOfLines={1}>
                          @{item.username}
                        </ThemedText>
                      ) : null}
                    </View>
                    {starting === item.id ? (
                      <ActivityIndicator color={ChatSurface.accent} />
                    ) : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                query.trim().length > 0 ? (
                  <View style={styles.center}>
                    <ThemedText style={styles.empty}>No results</ThemedText>
                  </View>
                ) : (
                  <View style={styles.center}>
                    <ThemedText style={styles.empty}>Start typing to find people</ThemedText>
                  </View>
                )
              }
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ChatSurface.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  title: {
    ...Typography.bodyBold,
    color: ChatSurface.textPrimary,
    fontSize: 17,
  },
  cancel: {
    ...Typography.body,
    color: ChatSurface.accent,
    fontSize: 16,
    width: 60,
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
  banner: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    backgroundColor: Palette.butter,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  bannerLabel: {
    ...Typography.bodyBold,
    color: Palette.ink,
    fontSize: 13,
  },
  list: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  userBody: {
    flex: 1,
  },
  userName: {
    ...Typography.body,
    color: ChatSurface.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  userHandle: {
    ...Typography.caption,
    color: ChatSurface.textSecondary,
    fontSize: 13,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  empty: {
    ...Typography.body,
    color: ChatSurface.textFaint,
  },
});
