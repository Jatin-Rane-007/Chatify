import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Avatar, IconButton } from '@/components/ui/refined';
import {
  ChatSurface,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useChatRoom } from '@/features/chat/hooks/useChatRoom';
import { usePresence } from '@/features/chat/hooks/usePresence';
import { chatService } from '@/features/chat/services/chatService';
import type { ChatMessage } from '@/lib/socket/events';
import { useAuthStore } from '@/stores/auth-store';
import { useSocket } from '@/context/SocketContext';
import { ChatFocusStore } from '@/stores/chatFocus-store';

import type { ChatRoomSummary } from '../services/chatService';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface ConversationViewProps {
  readonly room: ChatRoomSummary;
  readonly onBack: () => void;
  readonly onBlocked?: () => void;
}

export function ConversationView({ room, onBack, onBlocked }: ConversationViewProps) {
  const { user } = useAuthStore();
  const { socket } = useSocket();

  // Tell the backend + the local push handler this chat is foregrounded.
  // The backend skips OS pushes for this user while focused; the local
  // notification handler suppresses banners for matching chatId pushes.
  useEffect(() => {
    ChatFocusStore.set(room.id);
    socket?.raw.emit('chat:focus', { chatId: room.id });
    return () => {
      ChatFocusStore.set(null);
      socket?.raw.emit('chat:blur');
    };
  }, [room.id, socket]);
  const {
    messages,
    typingPeers,
    joined,
    error,
    sendMessage,
    deleteMessage,
    markRead,
    setTyping,
    setInitialMessages,
  } = useChatRoom(room.id);

  const partnerIds = room.partner ? [room.partner.id] : [];
  const presence = usePresence(partnerIds);
  const partnerOnline = room.partner ? !!presence[room.partner.id] : false;

  const [historyLoading, setHistoryLoading] = useState(true);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    chatService
      .getMessages(room.id)
      .then((msgs) => {
        if (!cancelled) setInitialMessages(msgs);
      })
      .catch(() => {
        if (!cancelled) setInitialMessages([]);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [room.id, setInitialMessages]);

  useEffect(() => {
    if (joined) void markRead();
  }, [joined, markRead, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]);

  const partnerName = room.partner?.displayName || room.partner?.username || 'Unknown';

  const handleOpenMenu = () => {
    if (!room.partner) return;
    const partner = room.partner;
    const partnerLabel = (partner.displayName || partner.username || 'this user').toString();
    Alert.alert(partnerLabel, undefined, [
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Block user?',
            `${partnerLabel} won’t be able to message you. This chat will be removed.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Block',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await chatService.blockUser(partner.id);
                    onBlocked?.();
                  } catch (e) {
                    Alert.alert('Failed to block', e instanceof Error ? e.message : 'Try again.');
                  }
                },
              },
            ],
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLongPress = (msg: ChatMessage) => {
    Alert.alert('Delete message?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteMessage(msg.id);
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.senderId === 'self' || (user ? item.senderId === user.id : false);
    return <MessageBubble message={item} isOwn={isOwn} onLongPress={handleLongPress} />;
  };

  const otherTyping = room.partner ? typingPeers.has(room.partner.id) : false;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
          >
            <ThemedText style={styles.backLabel}>‹</ThemedText>
          </Pressable>
          <Avatar label={partnerName} size={40} tone="tangerine" online={partnerOnline} />
          <View style={styles.headerBody}>
            <ThemedText style={styles.headerName} numberOfLines={1}>
              {partnerName}
            </ThemedText>
            <ThemedText style={styles.headerStatus} numberOfLines={1}>
              {otherTyping ? 'typing…' : partnerOnline ? 'online' : 'last seen recently'}
            </ThemedText>
          </View>
          <IconButton label="📞" onPress={() => Alert.alert('Calls', 'Coming soon.')} />
          <IconButton label="⋮" onPress={handleOpenMenu} />
        </View>
      </SafeAreaView>

      {error ? (
        <View style={styles.errorBar}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText style={styles.emptyText}>
              {historyLoading ? 'Loading…' : 'Say hello 👋'}
            </ThemedText>
          </View>
        }
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <MessageInput
        disabled={!joined}
        onSend={(content) => {
          void sendMessage(content);
        }}
        onTypingChange={setTyping}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ChatSurface.background,
  },
  headerSafe: {
    backgroundColor: ChatSurface.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 0.5,
    borderBottomColor: ChatSurface.divider,
    backgroundColor: ChatSurface.surface,
  },
  back: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: {
    color: ChatSurface.textPrimary,
    fontSize: 32,
    lineHeight: 32,
    fontWeight: '300',
  },
  headerBody: {
    flex: 1,
    gap: 2,
  },
  headerName: {
    ...Typography.bodyBold,
    color: ChatSurface.textPrimary,
    fontSize: 16,
  },
  headerStatus: {
    ...Typography.caption,
    color: ChatSurface.textSecondary,
    fontSize: 12,
  },
  errorBar: {
    backgroundColor: ChatSurface.danger,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  errorText: {
    ...Typography.bodyBold,
    color: ChatSurface.textPrimary,
    fontSize: 13,
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: Spacing.three,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  emptyText: {
    ...Typography.body,
    color: ChatSurface.textFaint,
  },
});
