'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@/lib/socket/events';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton, ChatShimmer, ProfileShimmer } from '@/components/ui/shimmer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NewChatDialog } from '@/features/chat/components/NewChatDialog';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { env } from '@/lib/env';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import {
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Shield,
  Zap,
  Check,
  CheckCheck,
  Trash2,
  CornerUpLeft,
  X,
  UserX,
  Plus,
  ArrowLeft,
} from 'lucide-react';

interface ChatRoom {
  id: string;
  createdAt: string;
  partner: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
  };
  lastMessage: Message | null;
  unreadCount: number;
}

interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  messageType: string;
  createdAt: string;
  isRead: boolean;
  replyToId: string | null;
}

export default function Home() {
  const { user, loading, token } = useAuth();

  // Dashboard & chat rooms state
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const activeRoom = chatRooms.find(r => r.id === activeRoomId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [messageType, setMessageType] = useState<string>('TEXT');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  // Sidebar filter
  const [filter, setFilter] = useState('');

  // Dialog visibility
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);

  // Modal confirmation states
  const [blockUserConfirm, setBlockUserConfirm] = useState<{
    id: string;
    displayName: string;
    username: string;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeRoomIdRef = useRef<string | null>(null);
  const activePartnerIdRef = useRef<string | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Predefined avatar gradient styling classes
  const getAvatarGradient = (id: string | null) => {
    switch (id) {
      case 'rose-orange': return 'from-rose-500 to-orange-500';
      case 'emerald-cyan': return 'from-emerald-400 to-cyan-500';
      case 'blue-indigo': return 'from-blue-500 to-indigo-600';
      case 'purple-pink': return 'from-purple-500 to-pink-500';
      case 'amber-yellow': return 'from-amber-400 to-yellow-500';
      case 'primary-violet':
      default:
        return 'from-primary to-violet-500';
    }
  };

  // Sync active room and partner refs to avoid socket reconnects
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  useEffect(() => {
    activePartnerIdRef.current = activeRoom?.partner?.id || null;
  }, [activeRoom?.partner?.id]);

  // Scroll to bottom of message feed
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch active chat rooms
  const fetchChatRooms = async () => {
    if (!token) return;
    try {
      const data = await api.get<ChatRoom[]>(endpoints.chats.rooms);
      if (data.success) {
        setChatRooms(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  };

  // 1. Socket.io Connection & Setup
  useEffect(() => {
    if (!user || !token) return;

    fetchChatRooms();

    // Establish WebSocket connection
    const socket = io(env.API_URL, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (msg: Message) => {
      // Refresh rooms sidebar to update last message & unread indicators
      fetchChatRooms();

      // Append message if we are currently viewing this chat room
      const currentRoomId = activeRoomIdRef.current;
      if (currentRoomId && msg.chatRoomId === currentRoomId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        // Mark the message as read since the room is active
        api.post(endpoints.chats.roomRead(currentRoomId)).catch((err) =>
          console.error('Failed to mark read', err),
        );
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, ({ roomId, messageId }: { roomId: string; messageId: string }) => {
      if (activeRoomIdRef.current === roomId) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
      fetchChatRooms();
    });

    socket.on(SOCKET_EVENTS.MESSAGE_READ, ({ roomId, readerId }: { roomId: string; readerId: string }) => {
      if (activeRoomIdRef.current !== roomId) return;
      // Reader marked our outgoing messages as read — flip our local flags.
      setMessages(prev => prev.map(m => (m.senderId !== readerId ? { ...m, isRead: true } : m)));
    });

    socket.on(SOCKET_EVENTS.USER_TYPING, ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (activePartnerIdRef.current === userId) {
        setIsPartnerTyping(isTyping);
      }
    });

    // A new direct chat room was just created (someone messaged us first, or
    // we started a chat). Refresh the sidebar so the room appears immediately.
    socket.on(SOCKET_EVENTS.ROOM_CREATED, () => {
      fetchChatRooms();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, token]);

  // 2. Load initial room messages when activeRoomId changes
  useEffect(() => {
    if (!activeRoomId || !token) return;

    const fetchMessages = async () => {
      try {
        const data = await api.get<Message[]>(endpoints.chats.roomMessages(activeRoomId));
        if (data.success) {
          setMessages(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };

    const markRead = async () => {
      try {
        await api.post(endpoints.chats.roomRead(activeRoomId));
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    };

    fetchMessages();
    markRead();
  }, [activeRoomId, token]);

  // 3. Join / Leave specific chat rooms over WebSocket for typing indicators
  useEffect(() => {
    if (!socketRef.current || !activeRoomId) return;

    const socket = socketRef.current;
    socket.emit(SOCKET_EVENTS.C_JOIN_ROOM, { roomId: activeRoomId });

    return () => {
      socket.emit(SOCKET_EVENTS.C_LEAVE_ROOM, { roomId: activeRoomId });
      setIsPartnerTyping(false);
    };
  }, [activeRoomId]);

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRoomId || !token) return;

    const content = inputText.trim();
    const currentReplyId = replyingTo?.id || null;

    // Reset input states locally
    setInputText('');
    setReplyingTo(null);
    setMessageType('TEXT');

    try {
      const resData = await api.post<Message>(
        endpoints.chats.roomMessages(activeRoomId),
        { content, messageType, replyToId: currentReplyId },
      );
      if (resData.success) {
        // Socket `message:new` may arrive before this HTTP response — dedupe by id
        // so the same message isn't appended twice.
        setMessages((prev) =>
          prev.some((m) => m.id === resData.data.id) ? prev : [...prev, resData.data],
        );
        fetchChatRooms(); // update sidebar last message
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // Send typing heartbeat to backend via socket
  const handleTyping = () => {
    if (!activeRoomId || !socketRef.current) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > 1500) {
      lastTypingSentRef.current = now;
      socketRef.current.emit(SOCKET_EVENTS.C_TYPING, { roomId: activeRoomId, isTyping: true });

      // Auto-clear typing indicators after 3 seconds of silence
      if ((window as any).typingTimeout) clearTimeout((window as any).typingTimeout);
      (window as any).typingTimeout = setTimeout(() => {
        if (socketRef.current && activeRoomIdRef.current) {
          socketRef.current.emit(SOCKET_EVENTS.C_TYPING, { roomId: activeRoomIdRef.current, isTyping: false });
        }
      }, 3000);
    }
  };

  // Delete own message
  const handleDeleteMessage = async (messageId: string) => {
    if (!token) return;
    try {
      const data = await api.del(endpoints.chats.message(messageId));
      if (data.success) {
        setMessages((prev) => prev.filter(m => m.id !== messageId));
      }
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  // After NewChatDialog creates/fetches a room, refresh sidebar and open it.
  const handleChatStarted = async (chatRoomId: string) => {
    await fetchChatRooms();
    setActiveRoomId(chatRoomId);
  };

  // Block user directly
  const handleBlockUser = async () => {
    if (!blockUserConfirm || !token) return;
    const userIdToBlock = blockUserConfirm.id;
    setBlockUserConfirm(null);

    try {
      const data = await api.post(endpoints.chats.blocked, { userIdToBlock });
      if (data.success) {
        fetchChatRooms();
        if (activeRoomId) {
          // If we had a room open with the blocked user, close it
          const room = chatRooms.find(r => r.id === activeRoomId);
          if (room && room.partner.id === userIdToBlock) {
            setActiveRoomId(null);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- PREMIUM SHIMMER LOADING ---
  if (loading) {
    return (
      <div className="flex h-dvh w-full bg-background transition-colors duration-300">
        <div className="w-80 border-r border-border bg-card/30 hidden md:flex flex-col p-4 space-y-6 shrink-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="space-y-4 flex-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-5 w-3/4 rounded-md" />
              </div>
            ))}
          </div>
          <ProfileShimmer />
        </div>
        <div className="flex-1 flex flex-col bg-background">
          <div className="h-16 border-b border-border bg-card/10 flex items-center justify-between px-6">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3.5 w-48" />
            </div>
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
          <div className="flex-1 overflow-hidden flex items-end">
            <ChatShimmer />
          </div>
          <div className="p-4 border-t border-border bg-card/10 flex items-center gap-3">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-12 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED CHATIFY WORKSPACE ---
  if (user) {
    return (
      <div className="relative flex h-dvh w-full bg-background overflow-hidden font-sans text-foreground">
        {/* Glowing background highlights */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none -z-10" />

        {/* SIDEBAR */}
        <aside
          className={`w-full md:w-80 border-r border-border bg-card/15 backdrop-blur-xl flex-col shrink-0 ${
            activeRoomId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header: avatar → settings, title, new chat, theme toggle */}
          <div className="h-16 px-4 border-b border-border flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              className={`h-9 w-9 rounded-full bg-gradient-to-tr ${getAvatarGradient(user.avatarUrl)} flex items-center justify-center font-bold text-white text-sm uppercase shrink-0 shadow-sm hover:opacity-90 transition-opacity`}
            >
              {(user.displayName ? user.displayName[0] : user.email[0]).toUpperCase()}
            </button>
            <span className="flex-1 text-base font-semibold tracking-tight text-foreground">
              Chats
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-accent/40"
              onClick={() => setNewChatOpen(true)}
              title="New chat"
            >
              <Plus className="h-4.5 w-4.5" />
            </Button>
            <ThemeToggle />
          </div>

          {/* Sidebar filter (chat-list search, not user search) */}
          <div className="px-3 py-3 border-b border-border">
            <Input
              type="text"
              placeholder="Search chats"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              leftIcon={<Search className="h-3.5 w-3.5 text-muted-foreground" />}
              className="h-9 bg-card/30"
            />
          </div>

          {/* CHAT LIST */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {(() => {
              const q = filter.trim().toLowerCase();
              const rooms = q
                ? chatRooms.filter((r) => {
                    const name = (r.partner?.displayName || r.partner?.username || '').toLowerCase();
                    return name.includes(q);
                  })
                : chatRooms;

              if (chatRooms.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center px-4 py-10 text-center space-y-3.5 rounded-xl bg-card/10 border border-dashed border-border/40 mx-2 mt-6">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs font-semibold text-foreground">No chats yet</span>
                      <span className="block text-[11px] text-muted-foreground leading-normal">
                        Tap the + button to find someone and start a chat.
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setNewChatOpen(true)}
                      className="h-8 text-xs font-semibold"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      <span>New chat</span>
                    </Button>
                  </div>
                );
              }

              if (rooms.length === 0) {
                return (
                  <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                    No chats match “{filter.trim()}”
                  </div>
                );
              }

              return rooms.map((room) => {
                const isActive = room.id === activeRoomId;
                const unread = room.unreadCount > 0 && !isActive;
                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      isActive
                        ? 'bg-accent/60 text-foreground'
                        : 'hover:bg-accent/30'
                    }`}
                  >
                    <div className={`h-11 w-11 rounded-full bg-gradient-to-tr ${getAvatarGradient(room.partner.avatarUrl)} flex items-center justify-center font-bold text-white text-sm uppercase shrink-0 shadow-sm`}>
                      {(room.partner.displayName ? room.partner.displayName[0] : room.partner.username[0]).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5 gap-2">
                        <span className={`block text-sm truncate ${unread ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                          {room.partner.displayName}
                        </span>
                        {room.lastMessage ? (
                          <span className={`text-[10px] shrink-0 ${unread ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                            {new Date(room.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`text-xs truncate flex-1 ${unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {room.lastMessage ? room.lastMessage.content : 'No messages yet'}
                        </p>
                        {unread ? (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                            {room.unreadCount > 99 ? '99+' : room.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              });
            })()}
          </div>
        </aside>


        {/* MAIN CHAT AREA */}
        <main
          className={`flex-1 flex-col bg-background relative overflow-y-auto ${
            activeRoomId ? 'flex' : 'hidden md:flex'
          }`}
        >
          {!activeRoomId ? (
            /* Empty state — WhatsApp Web style */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 select-none">
              <div className="h-20 w-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-sm">
                <MessageSquare className="h-9 w-9" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-3">
                {chatRooms.length === 0 ? 'Welcome to Chatify' : 'Select a chat'}
              </h1>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
                {chatRooms.length === 0
                  ? 'Tap the + button in the sidebar to find someone and start your first conversation. End-to-end private, real-time, simple.'
                  : 'Pick a conversation from the sidebar to start messaging, or tap the + button to chat with someone new.'}
              </p>
              <Button
                size="sm"
                onClick={() => setNewChatOpen(true)}
                className="h-9 px-4 text-sm font-semibold"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                New chat
              </Button>
            </div>
          ) : (
            /* Selected Active Chat Room Experience */
            activeRoom && (
              <>
                {/* Header */}
                <header className="h-16 px-3 sm:px-6 border-b border-border bg-card/10 flex items-center justify-between z-10 shrink-0">
                  <div className="min-w-0 flex items-center gap-2 sm:gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 md:hidden -ml-1"
                      onClick={() => setActiveRoomId(null)}
                      title="Back to chats"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className={`h-9 w-9 rounded-full bg-gradient-to-tr ${getAvatarGradient(activeRoom.partner.avatarUrl)} flex items-center justify-center font-bold text-white text-xs uppercase shrink-0 shadow-sm`}>
                      {(activeRoom.partner.displayName ? activeRoom.partner.displayName[0] : activeRoom.partner.username[0]).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-foreground font-bold text-sm min-w-0">
                        <span className="truncate">{activeRoom.partner.displayName}</span>
                        <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline shrink-0">@{activeRoom.partner.username}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate max-w-xl">
                        {activeRoom.partner.bio || 'Wants to communicate'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 hover:bg-accent text-destructive hover:text-destructive"
                      onClick={() => setBlockUserConfirm({ id: activeRoom.partner.id, displayName: activeRoom.partner.displayName, username: activeRoom.partner.username })}
                    >
                      <UserX className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </header>

                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4 bg-card/5">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-sm mx-auto select-none">
                      <div className={`h-12 w-12 rounded-full bg-gradient-to-tr ${getAvatarGradient(activeRoom.partner.avatarUrl)} flex items-center justify-center font-bold text-white text-sm uppercase shadow-md mb-4`}>
                        {activeRoom.partner.displayName[0].toUpperCase()}
                      </div>
                      <h3 className="text-sm font-bold text-foreground mb-1">Chat with {activeRoom.partner.displayName}</h3>
                      <p className="text-xs text-muted-foreground">
                        Say hi — your first message starts the conversation.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isSelf = m.senderId === user.id;
                      const replySource = m.replyToId ? messages.find(msg => msg.id === m.replyToId) : null;
                      
                      return (
                        <div
                          key={m.id}
                          className={`flex items-start gap-2 sm:gap-3 max-w-[85%] sm:max-w-[70%] group ${isSelf ? 'ml-auto flex-row-reverse' : ''}`}
                        >
                          <div className={`h-8 w-8 rounded-full bg-gradient-to-tr ${
                            isSelf ? getAvatarGradient(user.avatarUrl) : getAvatarGradient(activeRoom.partner.avatarUrl)
                          } flex items-center justify-center font-bold text-white text-xs uppercase shrink-0 select-none shadow-sm`}>
                            {isSelf ? user.displayName?.[0] : activeRoom.partner.displayName?.[0]}
                          </div>
                          
                          <div className="space-y-1 min-w-0">
                            {/* Message Header */}
                            <div className={`flex items-center gap-2 ${isSelf ? 'justify-end' : ''}`}>
                              <span className="text-[10px] font-semibold text-foreground">
                                {isSelf ? 'You' : activeRoom.partner.displayName}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Reply Source (Quoted box rendering) */}
                            {replySource && (
                              <div className={`p-2 rounded-lg border text-[10px] border-border/60 bg-muted/30 leading-snug truncate max-w-md ${isSelf ? 'text-right' : 'text-left'}`}>
                                <span className="block font-bold text-muted-foreground">
                                  Replying to {replySource.senderId === user.id ? 'You' : activeRoom.partner.displayName}:
                                </span>
                                <span className="italic">{replySource.content}</span>
                              </div>
                            )}

                            {/* Main Message Bubble */}
                            <div className="relative group">
                              <div className={`p-3 rounded-xl text-xs leading-relaxed shadow-sm break-words ${
                                isSelf
                                  ? 'bg-primary text-primary-foreground rounded-tr-none'
                                  : 'bg-card border border-border/80 rounded-tl-none'
                              }`}>
                                {m.messageType === 'IMAGE' || m.content.startsWith('http://') || m.content.startsWith('https://') && (m.content.endsWith('.jpg') || m.content.endsWith('.png') || m.content.endsWith('.webp') || m.content.endsWith('.gif')) ? (
                                  <div className="space-y-1.5">
                                    <img src={m.content} alt="Shared attachment" className="max-h-48 max-w-full rounded-lg object-cover shadow-sm bg-muted" onError={(e) => {
                                      // Fallback if image fails to load
                                      (e.target as HTMLElement).style.display = 'none';
                                    }} />
                                    <span className="block">{m.content}</span>
                                  </div>
                                ) : (
                                  m.content
                                )}
                              </div>

                              {/* Hover Message Actions (Reply & Delete) */}
                              <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 ${
                                isSelf ? 'right-full mr-2 flex-row-reverse' : 'left-full ml-2'
                              }`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded bg-card border border-border/60 text-muted-foreground hover:text-foreground shrink-0 shadow-sm"
                                  onClick={() => setReplyingTo(m)}
                                  title="Reply to message"
                                >
                                  <CornerUpLeft className="h-3 w-3" />
                                </Button>
                                {isSelf && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded bg-card border border-destructive/20 text-destructive hover:bg-destructive/10 shrink-0 shadow-sm"
                                    onClick={() => handleDeleteMessage(m.id)}
                                    title="Delete message"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Read Receipts */}
                            {isSelf && (
                              <div className="flex justify-end pr-0.5 pt-0.5">
                                {m.isRead ? (
                                  <span className="text-blue-500 font-bold" title="Read message">
                                    <CheckCheck className="h-3.5 w-3.5" />
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/60" title="Delivered">
                                    <Check className="h-3.5 w-3.5" />
                                  </span>
                                )}
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })
                  )}
                  {isPartnerTyping && (
                    <div className="flex items-center gap-2 max-w-[70%] text-muted-foreground pl-11 pb-2">
                      <div className="flex gap-1 items-center bg-card border border-border/80 py-2 px-3 rounded-xl rounded-tl-none shadow-sm text-[11px] animate-in slide-in-from-bottom-2 duration-200">
                        <span className="font-semibold text-foreground">{activeRoom.partner.displayName}</span> is typing
                        <span className="flex gap-0.5 ml-1.5 items-center h-2">
                          <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Panel */}
                <div className="p-3 sm:p-4 border-t border-border bg-card/5 backdrop-blur-md shrink-0">
                  {/* Replying indicator banner */}
                  {replyingTo && (
                    <div className="max-w-4xl mx-auto mb-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-[11px] animate-in slide-in-from-bottom-2 duration-200">
                      <span className="text-primary font-bold truncate">
                        Replying to {replyingTo.senderId === user.id ? 'yourself' : activeRoom.partner.displayName}: "{replyingTo.content}"
                      </span>
                      <button onClick={() => setReplyingTo(null)} className="text-primary hover:text-primary-hover shrink-0">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto items-center">
                    <Input
                      type="text"
                      placeholder={`Message ${activeRoom.partner.displayName}...`}
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        handleTyping();
                      }}
                      className="flex-1 bg-card border-border/80 focus-visible:bg-card h-11"
                    />

                    {/* Quick Emojis Selector */}
                    <div className="hidden sm:flex gap-1">
                      {['👍', '❤️', '🔥'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={async () => {
                            try {
                              await api.post(endpoints.chats.roomMessages(activeRoomId), {
                                content: emoji,
                                messageType: 'EMOJI',
                              });
                              fetchChatRooms();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="h-11 w-10 text-base rounded-lg border border-border/60 hover:bg-accent/40 active:scale-95 transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <Button type="submit" size="icon" className="h-11 w-11 rounded-lg shrink-0 active:scale-95 shadow-md">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>

                  {/* Attachment tips */}
                  <div className="max-w-4xl mx-auto mt-2 flex gap-4 text-[9px] text-muted-foreground px-1 select-none">
                    <span>💡 Tip: Paste an image URL to share photos instantly.</span>
                  </div>
                </div>
              </>
            )
          )}
        </main>

        {/* WhatsApp-style dialogs */}
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        <NewChatDialog
          open={newChatOpen}
          onOpenChange={setNewChatOpen}
          onChatStarted={handleChatStarted}
        />

        {/* BLOCK CONFIRMATION MODAL */}
        <Dialog open={!!blockUserConfirm} onOpenChange={(open) => !open && setBlockUserConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader className="text-center">
              <DialogTitle className="text-base font-extrabold text-destructive flex items-center justify-center gap-1.5">
                <UserX className="h-5 w-5" />
                <span>Block {blockUserConfirm?.displayName}?</span>
              </DialogTitle>
              <DialogDescription className="text-xs leading-normal pt-1.5">
                You won&apos;t receive messages or chat requests from @{blockUserConfirm?.username}. Existing chat histories between you will be removed permanently.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex sm:flex-col gap-2 pt-3">
              <Button type="button" variant="outline" className="flex-1 h-9.5 text-xs font-semibold" onClick={() => setBlockUserConfirm(null)}>
                Cancel
              </Button>
              <Button type="button" className="flex-1 h-9.5 text-xs font-bold bg-destructive text-white hover:bg-destructive-hover" onClick={handleBlockUser}>
                Block User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // --- GUEST LANDING PAGE ---
  return (
    <div className="relative min-h-dvh bg-background overflow-hidden flex flex-col font-sans text-foreground transition-colors duration-300">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none -z-10" />

      {/* Modern Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/60 border-b border-border/60 px-4 sm:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
            C
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground">
            Chatify
          </span>
        </div>

        <div className="flex items-center gap-3.5">
          <ThemeToggle />
          <Button variant="ghost" className="h-9 font-semibold text-sm hidden sm:inline-flex" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button className="h-9.5 text-xs sm:text-sm font-bold rounded-lg shadow-md active:scale-95" asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-14 sm:py-20 text-center z-10 max-w-5xl mx-auto w-full">
        {/* Floating badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/80 border border-border text-xs font-semibold text-primary mb-8 select-none shadow-sm animate-pulse-subtle">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Next-gen Real-time Messaging</span>
        </div>

        {/* Landing Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 sm:mb-8 leading-[1.05] text-foreground">
          Connect securely with{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-violet-500 to-indigo-500">
            Chatify
          </span>
        </h1>

        <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-3xl mb-10 sm:mb-12 leading-relaxed">
          Experience a beautiful, light-speed messaging client engineered for performance. Built with React 19, Tailwind CSS v4, and customizable theme designs.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full max-w-md mb-14 sm:mb-20">
          <Button size="lg" className="flex-1 h-12 shadow-lg shadow-primary/20 active:scale-98" asChild>
            <Link href="/signup">Get Started Free</Link>
          </Button>
          <Button size="lg" variant="outline" className="flex-1 h-12 border-border/80 bg-background/50 active:scale-98" asChild>
            <Link href="/login">Sign In with Email & Password</Link>
          </Button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-10">
          <Card className="text-left bg-card/30 backdrop-blur-md border-border/50 p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">Secure & Private</h3>
            <p className="text-xs text-muted-foreground leading-normal">
              Full security and secure authentication controls built for modern web architectures.
            </p>
          </Card>

          <Card className="text-left bg-card/30 backdrop-blur-md border-border/50 p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">Blazing Fast</h3>
            <p className="text-xs text-muted-foreground leading-normal">
              Real-time reactivity powered by Next.js and high-frequency modern states.
            </p>
          </Card>

          <Card className="text-left bg-card/30 backdrop-blur-md border-border/50 p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">Harmonious Themes</h3>
            <p className="text-xs text-muted-foreground leading-normal">
              Toggle smoothly between deep responsive dark theme and beautiful polished light themes.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 sm:px-8 py-8 border-t border-border bg-card/10 text-center text-xs text-muted-foreground z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} Chatify Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
