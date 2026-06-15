import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import {
  BrutalAlert,
  BrutalButton,
  BrutalCard,
  BrutalInput,
} from '@/components/ui/brutal';
import {
  BorderWidths,
  BrutalShadow,
  Palette,
  Radii,
  Spacing,
  Typography,
} from '@/constants/theme';
import { apiClient, unwrap, apiErrorMessage } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { AuthStore, type User } from '@/stores/auth-store';

type Mode = 'login' | 'signup';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return setError('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return setError('Enter a valid email');
    if (!password) return setError('Password is required');
    if (password.length < 8) return setError('Password must be at least 8 characters');

    setLoading(true);
    const path = mode === 'login' ? endpoints.auth.login : endpoints.auth.signup;
    try {
      const { data } = await apiClient.post(path, { email: trimmedEmail, password });
      const { user, token } = unwrap<{ user: User; token: string }>(data);
      if (mode === 'signup') AuthStore.setNewlyRegistered(true);
      await AuthStore.setAuth(user, token);
    } catch (err) {
      setError(apiErrorMessage(err, 'Connection failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SafeAreaView style={styles.safe}>
            <View style={styles.brandRow}>
              <View style={[styles.logoBlock, BrutalShadow.md]}>
                <ThemedText style={styles.logoMark}>C</ThemedText>
              </View>
              <View style={styles.wordmark}>
                <ThemedText style={styles.wordmarkText}>CHATIFY</ThemedText>
                <ThemedText style={styles.wordmarkSub}>// signal · noise · silence</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.headline}>
              {mode === 'login' ? 'WELCOME\nBACK.' : 'JOIN THE\nROOM.'}
            </ThemedText>
            <ThemedText style={styles.subhead}>
              {mode === 'login'
                ? 'Email + password. Get back to the signal.'
                : 'Pick an email, set a password (8+ chars). That’s it.'}
            </ThemedText>

            <BrutalCard style={styles.card} shadow="lg">
              <View style={styles.modeToggle}>
                {(['login', 'signup'] as const).map((m) => {
                  const active = m === mode;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => {
                        setMode(m);
                        setError(null);
                        setPassword('');
                      }}
                      disabled={loading}
                      style={[
                        styles.modeBtn,
                        {
                          backgroundColor: active ? Palette.bone : 'transparent',
                          borderColor: Palette.bone,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.modeLabel,
                          { color: active ? Palette.ink : Palette.bone },
                        ]}
                      >
                        {m === 'login' ? 'LOG IN' : 'SIGN UP'}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <BrutalInput
                label="Email"
                placeholder="name@domain.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                editable={!loading}
                icon={
                  <SymbolView
                    tintColor={Palette.tangerine}
                    name={{ ios: 'envelope.fill', android: 'mail', web: 'mail' }}
                    size={18}
                  />
                }
              />

              <BrutalInput
                label="Password"
                placeholder={mode === 'signup' ? 'min 8 characters' : 'your password'}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                secureTextEntry
                editable={!loading}
                icon={
                  <SymbolView
                    tintColor={Palette.tangerine}
                    name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                    size={18}
                  />
                }
              />

              {error ? <BrutalAlert message={error} /> : null}

              <BrutalButton
                label={mode === 'login' ? 'CONTINUE →' : 'CREATE ACCOUNT →'}
                onPress={handleSubmit}
                loading={loading}
              />
            </BrutalCard>

            <View style={styles.footer}>
              <View style={styles.footerDot} />
              <ThemedText style={styles.footerText}>
                BUILT FOR HUMANS · v1.0
              </ThemedText>
              <View style={styles.footerDot} />
            </View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.charcoal,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  safe: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.four,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  logoBlock: {
    height: 56,
    width: 56,
    backgroundColor: Palette.tangerine,
    borderWidth: BorderWidths.thick,
    borderColor: Palette.bone,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    ...Typography.title,
    color: Palette.ink,
    fontSize: 32,
    lineHeight: 34,
  },
  wordmark: { gap: 2 },
  wordmarkText: {
    ...Typography.heading,
    color: Palette.bone,
    fontSize: 22,
    letterSpacing: 2,
  },
  wordmarkSub: {
    ...Typography.caption,
    color: Palette.boneFaint,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  headline: {
    ...Typography.display,
    color: Palette.bone,
    marginTop: Spacing.two,
  },
  subhead: {
    ...Typography.body,
    color: Palette.boneMuted,
    maxWidth: 320,
  },
  card: {
    gap: Spacing.four,
    marginTop: Spacing.two,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderWidth: BorderWidths.thick,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  modeLabel: {
    ...Typography.label,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  footerDot: {
    height: 6,
    width: 6,
    backgroundColor: Palette.tangerine,
  },
  footerText: {
    ...Typography.label,
    color: Palette.boneFaint,
    fontSize: 10,
  },
});
