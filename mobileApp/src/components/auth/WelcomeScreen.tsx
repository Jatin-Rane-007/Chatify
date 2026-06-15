import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
  BrutalChip,
  BrutalInput,
} from '@/components/ui/brutal';
import {
  BorderWidths,
  Palette,
  Radii,
  Spacing,
  Typography,
} from '@/constants/theme';
import { apiClient, unwrap, apiErrorMessage } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { AuthStore, useAuthStore, type User } from '@/stores/auth-store';

type Step = 'welcome' | 'profile' | 'complete';

const STEP_ORDER: readonly Step[] = ['welcome', 'profile', 'complete'];

export function WelcomeScreen() {
  const { user, token } = useAuthStore();
  const [step, setStep] = useState<Step>('welcome');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) setDisplayName(user.displayName || user.email.split('@')[0]);
  }, [user]);

  const stepIndex = STEP_ORDER.indexOf(step);

  const goNext = () => {
    setError(null);
    if (step === 'welcome') return setStep('profile');
    if (step === 'profile') {
      if (!displayName.trim()) return setError('A display name is required');
      void completeSetup();
    }
  };

  const completeSetup = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const { data } = await apiClient.put(endpoints.auth.profile, {
        displayName: displayName.trim(),
      });
      const result = unwrap<{ user?: User }>(data);
      const updatedUser = result?.user ?? { ...user, displayName: displayName.trim() };
      await AuthStore.setAuth(updatedUser, token);
      setStep('complete');
    } catch (err) {
      setError(apiErrorMessage(err, 'Connection failed'));
    } finally {
      setLoading(false);
    }
  };

  const finish = () => AuthStore.setNewlyRegistered(false);

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
            <View style={styles.stepBar}>
              {STEP_ORDER.map((s, i) => {
                const active = i === stepIndex;
                const done = i < stepIndex;
                return (
                  <View
                    key={s}
                    style={[
                      styles.stepCell,
                      {
                        backgroundColor: done
                          ? Palette.mint
                          : active
                            ? Palette.tangerine
                            : Palette.surface,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.stepCellText,
                        { color: done || active ? Palette.ink : Palette.boneMuted },
                      ]}
                    >
                      {`0${i + 1}`}
                    </ThemedText>
                  </View>
                );
              })}
            </View>

            {step === 'welcome' && (
              <BrutalCard shadow="lg" style={styles.card}>
                <BrutalChip label="STEP · 01" tone="primary" />
                <ThemedText style={styles.title}>{"YOU'RE\nIN."}</ThemedText>
                <ThemedText style={styles.body}>
                  Welcome aboard. Chatify is built loud, lean, and unapologetically
                  fast. Two more taps and you&apos;re live.
                </ThemedText>

                <View style={styles.featureGrid}>
                  <FeatureBlock
                    icon="bolt.fill"
                    title="REALTIME"
                    desc="Sub-second message delivery."
                    accent={Palette.tangerine}
                  />
                  <FeatureBlock
                    icon="lock.shield.fill"
                    title="SECURE"
                    desc="JWT auth + secure key store."
                    accent={Palette.butter}
                  />
                </View>

                <BrutalButton label="LET'S GO →" onPress={goNext} />
              </BrutalCard>
            )}

            {step === 'profile' && (
              <BrutalCard shadow="lg" style={styles.card}>
                <BrutalChip label="STEP · 02" tone="primary" />
                <ThemedText style={styles.title}>{"PICK A\nNAME."}</ThemedText>
                <ThemedText style={styles.body}>
                  This is the name humans will see. Make it count.
                </ThemedText>

                <BrutalInput
                  label="Display name"
                  placeholder="Alex Mercer"
                  value={displayName}
                  onChangeText={setDisplayName}
                  maxLength={40}
                  editable={!loading}
                  icon={
                    <SymbolView
                      tintColor={Palette.tangerine}
                      name={{ ios: 'person.fill', android: 'person', web: 'person' }}
                      size={18}
                    />
                  }
                />

                {error ? <BrutalAlert message={error} /> : null}

                <View style={styles.row}>
                  <View style={{ width: 120 }}>
                    <BrutalButton
                      label="BACK"
                      tone="ghost"
                      onPress={() => setStep('welcome')}
                      disabled={loading}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <BrutalButton label="FINISH →" onPress={goNext} loading={loading} />
                  </View>
                </View>
              </BrutalCard>
            )}

            {step === 'complete' && (
              <BrutalCard shadow="lg" style={styles.card}>
                <BrutalChip label="STEP · 03" tone="mint" />
                <ThemedText style={styles.title}>{"ALL\nDONE."}</ThemedText>
                <ThemedText style={styles.body}>
                  Hello, {displayName}. Your workspace is open. Walk in.
                </ThemedText>

                <View style={[styles.confirmBlock, { borderColor: Palette.bone }]}>
                  <SymbolView
                    tintColor={Palette.mint}
                    name={{ ios: 'checkmark.seal.fill', android: 'check_circle', web: 'check_circle' }}
                    size={22}
                  />
                  <ThemedText style={styles.confirmText}>
                    Profile saved. Channels are warm.
                  </ThemedText>
                </View>

                <BrutalButton label="ENTER WORKSPACE →" onPress={finish} tone="accent" />
              </BrutalCard>
            )}
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

interface FeatureProps {
  readonly icon: string;
  readonly title: string;
  readonly desc: string;
  readonly accent: string;
}

function FeatureBlock({ icon, title, desc, accent }: FeatureProps) {
  return (
    <View style={[styles.feature, { borderColor: Palette.bone }]}>
      <View style={[styles.featureIcon, { backgroundColor: accent }]}>
        <SymbolView
          tintColor={Palette.ink}
          name={{ ios: icon, android: 'star', web: 'star' }}
          size={18}
        />
      </View>
      <ThemedText style={styles.featureTitle}>{title}</ThemedText>
      <ThemedText style={styles.featureDesc}>{desc}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.charcoal },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  safe: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.four,
  },
  stepBar: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stepCell: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderWidth: BorderWidths.thick,
    borderColor: Palette.bone,
    borderRadius: Radii.sm,
    alignItems: 'center',
  },
  stepCellText: {
    ...Typography.label,
    fontSize: 12,
  },
  card: { gap: Spacing.three },
  title: {
    ...Typography.display,
    color: Palette.bone,
    fontSize: 40,
    lineHeight: 42,
  },
  body: {
    ...Typography.body,
    color: Palette.boneMuted,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  feature: {
    flex: 1,
    padding: Spacing.three,
    borderWidth: BorderWidths.thick,
    borderRadius: Radii.md,
    backgroundColor: Palette.ink,
    gap: Spacing.two,
  },
  featureIcon: {
    height: 36,
    width: 36,
    borderWidth: BorderWidths.thick,
    borderColor: Palette.bone,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    ...Typography.label,
    color: Palette.bone,
    fontSize: 12,
  },
  featureDesc: {
    ...Typography.caption,
    color: Palette.boneMuted,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  confirmBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: BorderWidths.thick,
    borderRadius: Radii.md,
    backgroundColor: Palette.ink,
  },
  confirmText: {
    ...Typography.bodyBold,
    color: Palette.bone,
    flex: 1,
  },
});
