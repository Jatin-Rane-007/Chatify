import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { ChatSurface, Palette } from '@/constants/theme';
import { useNavigationStore } from '@/stores/navigation-store';

export default function AppTabs() {
  const { tabBarHidden } = useNavigationStore();

  return (
    <NativeTabs
      backgroundColor={ChatSurface.background}
      indicatorColor={ChatSurface.surfaceRaised}
      labelStyle={{ selected: { color: Palette.bone } }}
      hidden={tabBarHidden}
    >
      <NativeTabs.Trigger name="index" disableAutomaticContentInsets={true}>
        <NativeTabs.Trigger.Label>Chats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="updates" disableAutomaticContentInsets={true}>
        <NativeTabs.Trigger.Label>Updates</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calls" disableAutomaticContentInsets={true}>
        <NativeTabs.Trigger.Label>Calls</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
