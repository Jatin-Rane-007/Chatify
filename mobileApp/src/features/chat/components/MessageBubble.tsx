import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  ChatSurface,
  Palette,
  Radii,
  Spacing,
  Typography,
} from '@/constants/theme';
import type { ChatMessage } from '@/lib/socket/events';

interface MessageBubbleProps {
  readonly message: ChatMessage;
  readonly isOwn: boolean;
  readonly onLongPress?: (message: ChatMessage) => void;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function MessageBubbleBase({ message, isOwn, onLongPress }: MessageBubbleProps) {
  const handleLongPress = () => {
    if (isOwn && onLongPress) onLongPress(message);
  };

  const textColor = isOwn ? Palette.ink : ChatSurface.textPrimary;
  const metaColor = isOwn ? 'rgba(10,10,10,0.55)' : ChatSurface.textFaint;

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={350}
        style={({ pressed }) => [
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          pressed && { opacity: 0.85 },
        ]}
      >
        <ThemedText style={[styles.content, { color: textColor }]}>
          {message.content}
        </ThemedText>
        <View style={styles.metaRow}>
          <ThemedText style={[styles.meta, { color: metaColor }]}>
            {formatTime(message.createdAt)}
          </ThemedText>
          {isOwn ? (
            <ThemedText
              style={[
                styles.meta,
                {
                  color: message.isRead
                    ? '#1F6FEB'
                    : metaColor,
                  fontWeight: '700',
                },
              ]}
            >
              {message.isRead ? '✓✓' : '✓'}
            </ThemedText>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

export const MessageBubble = React.memo(MessageBubbleBase);

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
    flexDirection: 'row',
  },
  rowOwn: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radii.xl,
    gap: 2,
  },
  bubbleOwn: {
    backgroundColor: ChatSurface.bubbleOwn,
    borderBottomRightRadius: Radii.sm,
  },
  bubbleOther: {
    backgroundColor: ChatSurface.bubbleOther,
    borderBottomLeftRadius: Radii.sm,
  },
  content: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: 2,
  },
  meta: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '500',
  },
});
