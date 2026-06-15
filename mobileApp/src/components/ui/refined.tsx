import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type ViewProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  BorderWidths,
  ChatSurface,
  Elevation,
  Palette,
  Radii,
  Spacing,
  Typography,
} from '@/constants/theme';

/**
 * Refined dark-mode primitives for the WhatsApp-hybrid surface.
 * Brutal primitives (BrutalCard / BrutalButton) stay in use on auth screens
 * — these are scoped to the chat / settings / updates / calls flows.
 */

interface AvatarProps {
  readonly label: string;
  readonly size?: number;
  readonly tone?: 'tangerine' | 'mint' | 'butter' | 'surface';
  readonly online?: boolean;
}

export function Avatar({ label, size = 48, tone = 'tangerine', online }: AvatarProps) {
  const bg =
    tone === 'mint'
      ? Palette.mint
      : tone === 'butter'
        ? Palette.butter
        : tone === 'surface'
          ? ChatSurface.surfaceRaised
          : Palette.tangerine;
  const fg = tone === 'surface' ? Palette.bone : Palette.ink;
  const initial = (label || '?').charAt(0).toUpperCase();
  const dot = Math.max(10, Math.round(size * 0.25));

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <ThemedText
        style={[styles.avatarLabel, { color: fg, fontSize: Math.round(size * 0.42) }]}
      >
        {initial}
      </ThemedText>
      {online ? (
        <View
          style={[
            styles.onlineDot,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: ChatSurface.success,
              borderColor: ChatSurface.background,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

interface IconButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly tone?: 'ghost' | 'accent';
  readonly size?: number;
  readonly disabled?: boolean;
}

export function IconButton({
  label,
  onPress,
  tone = 'ghost',
  size = 40,
  disabled,
}: IconButtonProps) {
  const bg = tone === 'accent' ? ChatSurface.accent : 'transparent';
  const fg = tone === 'accent' ? Palette.ink : ChatSurface.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
        },
      ]}
    >
      <ThemedText
        allowFontScaling={false}
        style={[
          styles.iconLabel,
          { color: fg, fontSize: Math.round(size * 0.5), lineHeight: size },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

interface ListRowProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: string;
  readonly iconTone?: 'tangerine' | 'mint' | 'butter' | 'surface' | 'cherry';
  readonly right?: React.ReactNode;
  readonly onPress?: () => void;
  readonly destructive?: boolean;
  readonly showChevron?: boolean;
}

export function ListRow({
  title,
  subtitle,
  icon,
  iconTone = 'surface',
  right,
  onPress,
  destructive,
  showChevron = true,
}: ListRowProps) {
  const iconBg =
    iconTone === 'tangerine'
      ? Palette.tangerine
      : iconTone === 'mint'
        ? Palette.mint
        : iconTone === 'butter'
          ? Palette.butter
          : iconTone === 'cherry'
            ? Palette.cherry
            : ChatSurface.surfaceRaised;
  const iconFg = iconTone === 'surface' ? Palette.bone : Palette.ink;

  const content = (
    <View style={styles.row}>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
          <ThemedText style={[styles.rowIconLabel, { color: iconFg }]}>{icon}</ThemedText>
        </View>
      ) : null}
      <View style={styles.rowBody}>
        <ThemedText
          style={[
            styles.rowTitle,
            destructive ? { color: ChatSurface.danger } : null,
          ]}
        >
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right ? (
        <View style={styles.rowRight}>{right}</View>
      ) : onPress && showChevron ? (
        <ThemedText style={styles.chevron}>›</ThemedText>
      ) : null}
    </View>
  );

  if (!onPress) return <View style={styles.rowWrap}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: ChatSurface.surfaceRaised }}
      style={({ pressed }) => [
        styles.rowWrap,
        pressed && { backgroundColor: ChatSurface.surface },
      ]}
    >
      {content}
    </Pressable>
  );
}

interface SectionProps extends ViewProps {
  readonly title?: string;
  readonly footer?: string;
}

export function Section({ title, footer, children, style, ...rest }: SectionProps) {
  return (
    <View style={[styles.section, style]} {...rest}>
      {title ? <ThemedText style={styles.sectionTitle}>{title}</ThemedText> : null}
      <View style={styles.sectionBody}>{children}</View>
      {footer ? <ThemedText style={styles.sectionFooter}>{footer}</ThemedText> : null}
    </View>
  );
}

interface FabProps {
  readonly icon: string;
  readonly onPress: (e: GestureResponderEvent) => void;
  readonly tone?: 'accent' | 'surface';
}

export function Fab({ icon, onPress, tone = 'accent' }: FabProps) {
  const bg = tone === 'accent' ? ChatSurface.accent : ChatSurface.surfaceRaised;
  const fg = tone === 'accent' ? Palette.ink : Palette.bone;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        Elevation.high,
        { backgroundColor: bg, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <ThemedText style={[styles.fabLabel, { color: fg }]}>{icon}</ThemedText>
    </Pressable>
  );
}

interface EmptyStateProps {
  readonly icon?: string;
  readonly title: string;
  readonly body?: string;
}

export function EmptyState({ icon, title, body }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      {icon ? <ThemedText style={styles.emptyIcon}>{icon}</ThemedText> : null}
      <ThemedText style={styles.emptyTitle}>{title}</ThemedText>
      {body ? <ThemedText style={styles.emptyBody}>{body}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarLabel: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderWidth: BorderWidths.thick,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  iconLabel: {
    fontWeight: '500',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  rowWrap: {
    backgroundColor: ChatSurface.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconLabel: {
    fontSize: 18,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...Typography.body,
    color: ChatSurface.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtitle: {
    ...Typography.caption,
    color: ChatSurface.textSecondary,
    fontSize: 13,
  },
  rowRight: {
    marginLeft: 'auto',
  },
  chevron: {
    color: ChatSurface.textFaint,
    fontSize: 22,
    fontWeight: '500',
    marginLeft: 'auto',
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    ...Typography.label,
    color: ChatSurface.textSecondary,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  sectionBody: {
    backgroundColor: ChatSurface.surface,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: ChatSurface.divider,
  },
  sectionFooter: {
    ...Typography.caption,
    color: ChatSurface.textFaint,
    paddingHorizontal: Spacing.four,
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: {
    fontSize: 30,
    fontWeight: '500',
    lineHeight: 32,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.six,
  },
  emptyIcon: {
    fontSize: 48,
    lineHeight: 60,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    ...Typography.heading,
    color: ChatSurface.textPrimary,
    fontSize: 18,
    textAlign: 'center',
  },
  emptyBody: {
    ...Typography.body,
    color: ChatSurface.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
});
