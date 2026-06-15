import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  BorderWidths,
  BrutalShadow,
  Palette,
  Radii,
  Spacing,
  Typography,
} from '@/constants/theme';

type Tone = 'primary' | 'accent' | 'ghost' | 'danger';

interface BrutalCardProps extends ViewProps {
  readonly tone?: 'surface' | 'raised' | 'accent';
  readonly shadow?: 'sm' | 'md' | 'lg' | 'accent' | 'none';
}

export function BrutalCard({ tone = 'surface', shadow = 'md', style, children, ...rest }: BrutalCardProps) {
  const bg =
    tone === 'raised' ? Palette.surfaceRaised : tone === 'accent' ? Palette.tangerine : Palette.surface;
  const shadowStyle = shadow === 'none' ? undefined : BrutalShadow[shadow];
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bg, borderColor: Palette.bone },
        shadowStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

interface BrutalButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly tone?: Tone;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly compact?: boolean;
}

export function BrutalButton({
  label,
  onPress,
  tone = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  compact = false,
}: BrutalButtonProps) {
  const toneStyle = TONE_STYLES[tone];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: toneStyle.bg, borderColor: toneStyle.border },
        fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' },
        !pressed && !isDisabled && BrutalShadow.md,
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={toneStyle.fg} size="small" />
      ) : (
        <ThemedText style={[styles.buttonLabel, { color: toneStyle.fg }]}>{label}</ThemedText>
      )}
    </Pressable>
  );
}

const TONE_STYLES: Record<Tone, { bg: string; fg: string; border: string }> = {
  primary: { bg: Palette.tangerine, fg: Palette.ink, border: Palette.ink },
  accent: { bg: Palette.butter, fg: Palette.ink, border: Palette.ink },
  ghost: { bg: 'transparent', fg: Palette.bone, border: Palette.bone },
  danger: { bg: Palette.cherry, fg: Palette.bone, border: Palette.ink },
};

interface BrutalInputProps extends TextInputProps {
  readonly label: string;
  readonly icon?: React.ReactNode;
}

export function BrutalInput({ label, icon, style, ...rest }: BrutalInputProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={styles.inputBlock}>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      <View
        style={[
          styles.inputWrapper,
          { borderColor: focused ? Palette.tangerine : Palette.bone },
          focused && BrutalShadow.accent,
        ]}
      >
        {icon ? <View style={styles.inputIcon}>{icon}</View> : null}
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={Palette.boneFaint}
          style={[styles.input, { color: Palette.bone }, style]}
        />
      </View>
    </View>
  );
}

interface BrutalChipProps {
  readonly label: string;
  readonly tone?: 'neutral' | 'primary' | 'accent' | 'mint';
}

export function BrutalChip({ label, tone = 'neutral' }: BrutalChipProps) {
  const bg =
    tone === 'primary'
      ? Palette.tangerine
      : tone === 'accent'
        ? Palette.butter
        : tone === 'mint'
          ? Palette.mint
          : Palette.surfaceRaised;
  const fg = tone === 'neutral' ? Palette.bone : Palette.ink;
  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: Palette.ink }]}>
      <ThemedText style={[styles.chipLabel, { color: fg }]}>{label}</ThemedText>
    </View>
  );
}

interface BrutalAlertProps {
  readonly message: string;
  readonly tone?: 'danger' | 'mint';
}

export function BrutalAlert({ message, tone = 'danger' }: BrutalAlertProps) {
  const bg = tone === 'danger' ? Palette.cherry : Palette.mint;
  return (
    <View style={[styles.alert, { backgroundColor: bg, borderColor: Palette.ink }, BrutalShadow.sm]}>
      <ThemedText style={[styles.alertLabel, { color: Palette.ink }]}>{message}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: BorderWidths.thick,
    borderRadius: Radii.lg,
    padding: Spacing.four,
  },
  button: {
    minHeight: 56,
    paddingHorizontal: Spacing.four,
    borderWidth: BorderWidths.thick,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  buttonPressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    ...Typography.label,
    fontSize: 13,
    letterSpacing: 1.8,
  },
  inputBlock: {
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  inputLabel: {
    ...Typography.label,
    color: Palette.boneMuted,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    backgroundColor: Palette.ink,
    borderWidth: BorderWidths.thick,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
  },
  inputIcon: {
    marginRight: Spacing.two,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: 0,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: BorderWidths.thick,
    borderRadius: Radii.sm,
    alignSelf: 'flex-start',
  },
  chipLabel: {
    ...Typography.label,
    fontSize: 10,
  },
  alert: {
    borderWidth: BorderWidths.thick,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    alignSelf: 'stretch',
  },
  alertLabel: {
    ...Typography.bodyBold,
    fontSize: 13,
  },
});
