import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import {
  BorderWidths,
  ChatSurface,
  MaxContentWidth,
  Palette,
  Radii,
  Spacing,
  Typography,
} from '@/constants/theme';

import { useNavigationStore } from '@/stores/navigation-store';

export default function AppTabs() {
  const { tabBarHidden } = useNavigationStore();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      {!tabBarHidden && (
        <TabList asChild>
          <CustomTabList>
            <TabTrigger name="chats" href="/" asChild>
              <TabButton>Chats</TabButton>
            </TabTrigger>
            <TabTrigger name="updates" href="/updates" asChild>
              <TabButton>Updates</TabButton>
            </TabTrigger>
            <TabTrigger name="calls" href="/calls" asChild>
              <TabButton>Calls</TabButton>
            </TabTrigger>
          </CustomTabList>
        </TabList>
      )}
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View
        style={[
          styles.tabButtonView,
          isFocused ? styles.tabButtonActive : null,
        ]}
      >
        <ThemedText
          style={[
            styles.tabLabel,
            { color: isFocused ? Palette.bone : ChatSurface.textSecondary },
          ]}
        >
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        <ThemedText style={styles.brandText}>Chatify</ThemedText>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radii.xxl,
    backgroundColor: ChatSurface.surface,
    borderWidth: BorderWidths.hair,
    borderColor: ChatSurface.divider,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    ...Typography.bodyBold,
    color: Palette.tangerine,
    marginRight: 'auto',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.lg,
  },
  tabButtonActive: {
    backgroundColor: ChatSurface.surfaceRaised,
  },
  tabLabel: {
    ...Typography.bodyBold,
    fontSize: 14,
  },
});
