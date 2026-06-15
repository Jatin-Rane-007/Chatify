import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { ChatSurface } from '@/constants/theme';
import { ConversationView } from '@/features/chat/components/ConversationView';
import { NewChatSheet } from '@/features/chat/components/NewChatSheet';
import { RoomListView } from '@/features/chat/components/RoomListView';
import { chatRoomsQueryKey } from '@/features/chat/hooks/useChatRooms';
import type { ChatRoomSummary } from '@/features/chat/services/chatService';
import { useNavigationStore } from '@/stores/navigation-store';

export default function ChatsScreen() {
  const [active, setActive] = useState<ChatRoomSummary | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const queryClient = useQueryClient();
  const { setTabBarHidden } = useNavigationStore();

  useEffect(() => {
    setTabBarHidden(!!active);
    return () => {
      setTabBarHidden(false);
    };
  }, [active, setTabBarHidden]);

  return (
    <View style={styles.root}>
      {active ? (
        <ConversationView
          room={active}
          onBack={() => {
            setTabBarHidden(false);
            setActive(null);
          }}
          onBlocked={() => {
            setTabBarHidden(false);
            setActive(null);
          }}
        />
      ) : (
        <RoomListView
          onOpen={(room) => {
            setTabBarHidden(true);
            setActive(room);
          }}
          onNewChat={() => setSheetVisible(true)}
          onOpenSettings={() => setSettingsVisible(true)}
        />
      )}
      <SettingsScreen
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
      <NewChatSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onChatStarted={async (chatRoomId, user) => {
          await queryClient.invalidateQueries({ queryKey: chatRoomsQueryKey });
          setTabBarHidden(true);
          setActive({
            id: chatRoomId,
            createdAt: new Date().toISOString(),
            partner: {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              bio: user.bio,
            },
            lastMessage: null,
            unreadCount: 0,
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ChatSurface.background,
  },
});
