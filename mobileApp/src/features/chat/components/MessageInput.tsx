import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import {
  ChatSurface,
  Palette,
  Radii,
  Spacing,
  Typography,
} from '@/constants/theme';

interface MessageInputProps {
  readonly onSend: (content: string) => void;
  readonly onTypingChange: (isTyping: boolean) => void;
  readonly disabled?: boolean;
}

export function MessageInput({ onSend, onTypingChange }: MessageInputProps) {
  const [value, setValue] = useState('');

  const handleChange = (text: string) => {
    setValue(text);
    onTypingChange(text.trim().length > 0);
  };

  const handleSend = () => {
    Alert.alert('[debug] send tapped', `value="${value}" canSend=${value.trim().length > 0}`);
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
    onTypingChange(false);
  };

  const canSend = value.trim().length > 0;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={value}
            onChangeText={handleChange}
            placeholder="Message"
            placeholderTextColor={ChatSurface.textFaint}
            multiline
            style={styles.input}
            onBlur={() => onTypingChange(false)}
          />
        </View>
        <TouchableOpacity
          onPress={handleSend}
          onPressIn={() => Alert.alert('[debug] pressIn')}
          disabled={!canSend}
          activeOpacity={0.7}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
        >
          <ThemedText style={styles.sendLabel}>➤</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: ChatSurface.background,
  },
  container: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    backgroundColor: ChatSurface.background,
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: ChatSurface.inputBg,
    borderRadius: Radii.xxl,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    justifyContent: 'center',
  },
  input: {
    ...Typography.body,
    color: ChatSurface.textPrimary,
    paddingVertical: 0,
    minHeight: 24,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ChatSurface.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendLabel: {
    fontSize: 18,
    color: Palette.ink,
    fontWeight: '700',
  },
});
