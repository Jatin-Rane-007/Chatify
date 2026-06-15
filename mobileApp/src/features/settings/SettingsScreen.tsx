import React from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Avatar, ListRow, Section } from '@/components/ui/refined';
import {
  ChatSurface,
  Palette,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Settings — WhatsApp-style. Rendered as a full-screen Modal from the
 * Chats screen because `NativeTabs` doesn't host a Stack we can push onto.
 * Backend integrations tracked in docs/mobile-ui-backend-todo.md.
 */
interface SettingsScreenProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function SettingsScreen({ visible, onClose }: SettingsScreenProps) {
  const { user, clearAuth } = useAuthStore();
  const name = user?.displayName || user?.username || user?.email?.split('@')[0] || 'You';
  const bio = user?.bio || 'Hey there! I am using Chatify.';
  const handle = user?.username ? `@${user.username}` : user?.email || '';

  const handleLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again to send messages.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          onClose();
          void clearAuth();
        },
      },
    ]);
  };

  const stub = (label: string) => () =>
    Alert.alert(label, 'Coming soon.');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={10} style={styles.back}>
              <ThemedText style={styles.backLabel}>‹</ThemedText>
            </Pressable>
            <ThemedText style={styles.title}>Settings</ThemedText>
            <View style={styles.back} />
          </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Pressable
            onPress={stub('Edit profile')}
            android_ripple={{ color: ChatSurface.surfaceRaised }}
            style={({ pressed }) => [
              styles.profileRow,
              pressed && { backgroundColor: ChatSurface.surface },
            ]}
          >
            <Avatar label={name} size={64} tone="tangerine" />
            <View style={styles.profileBody}>
              <ThemedText style={styles.profileName} numberOfLines={1}>
                {name}
              </ThemedText>
              <ThemedText style={styles.profileBio} numberOfLines={1}>
                {bio}
              </ThemedText>
              {handle ? (
                <ThemedText style={styles.profileHandle} numberOfLines={1}>
                  {handle}
                </ThemedText>
              ) : null}
            </View>
            <ThemedText style={styles.qr}>▢</ThemedText>
          </Pressable>

          <Section>
            <ListRow
              icon="🔑"
              iconTone="surface"
              title="Account"
              subtitle="Security notifications, change number"
              onPress={stub('Account')}
            />
            <ListRow
              icon="🔒"
              iconTone="surface"
              title="Privacy"
              subtitle={`Who can contact you · ${user?.privacySetting ?? 'EVERYONE'}`}
              onPress={stub('Privacy')}
            />
            <ListRow
              icon="💬"
              iconTone="surface"
              title="Chats"
              subtitle="Theme, wallpaper, chat history"
              onPress={stub('Chats')}
            />
            <ListRow
              icon="🔔"
              iconTone="surface"
              title="Notifications"
              subtitle="Message, group & call tones"
              onPress={stub('Notifications')}
            />
            <ListRow
              icon="💾"
              iconTone="surface"
              title="Storage and data"
              subtitle="Network usage, auto-download"
              onPress={stub('Storage and data')}
            />
          </Section>

          <Section>
            <ListRow
              icon="❓"
              iconTone="surface"
              title="Help"
              subtitle="Help center, contact us, terms"
              onPress={stub('Help')}
            />
            <ListRow
              icon="👥"
              iconTone="surface"
              title="Invite a friend"
              onPress={stub('Invite a friend')}
            />
          </Section>

          <View style={styles.logoutWrap}>
            <Pressable
              onPress={handleLogout}
              android_ripple={{ color: ChatSurface.surfaceRaised }}
              style={({ pressed }) => [
                styles.logoutBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <ThemedText style={styles.logoutLabel}>Log out</ThemedText>
            </Pressable>
          </View>

          <ThemedText style={styles.footer}>
            Chatify · made with care
          </ThemedText>
          </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 0.5,
    borderBottomColor: ChatSurface.divider,
  },
  back: {
    width: 40,
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
  title: {
    ...Typography.bodyBold,
    color: ChatSurface.textPrimary,
    fontSize: 17,
    flex: 1,
    textAlign: 'center',
    marginLeft: -40,
  },
  scroll: {
    paddingBottom: Spacing.six,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  profileBody: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    ...Typography.heading,
    color: ChatSurface.textPrimary,
    fontSize: 19,
    fontWeight: '600',
  },
  profileBio: {
    ...Typography.caption,
    color: ChatSurface.textSecondary,
    fontSize: 13,
  },
  profileHandle: {
    ...Typography.caption,
    color: ChatSurface.textFaint,
    fontSize: 12,
    marginTop: 2,
  },
  qr: {
    color: ChatSurface.accent,
    fontSize: 24,
  },
  logoutWrap: {
    paddingTop: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  logoutBtn: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  logoutLabel: {
    ...Typography.bodyBold,
    color: ChatSurface.danger,
    fontSize: 15,
  },
  footer: {
    ...Typography.caption,
    color: ChatSurface.textFaint,
    textAlign: 'center',
    fontSize: 12,
    marginTop: Spacing.four,
  },
});
