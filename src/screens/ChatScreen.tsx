import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import ChatBubble from '../components/ChatBubble';
import ChatSuggestions from '../components/ChatSuggestions';
import DemoModeBanner from '../components/DemoModeBanner';
import { sendChatMessage } from '../lib/openai';
import { ChatMessage, ChatSession, ActionCard } from '../types';
import { format } from 'date-fns';
import { PERSONA_LIST, PersonaId } from '../constants/personas';

interface Props {
  navigation: { navigate: (screen: string) => void };
  route?: { params?: { preloadMessage?: string } };
}

function TypingIndicator() {
  const { colors } = useTheme();
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 9 }),
    ]).start();

    const animDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      );
    animDot(dot1, 0).start();
    animDot(dot2, 150).start();
    animDot(dot3, 300).start();
  }, []);

  return (
    <Animated.View
      style={[
        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginBottom: 12 },
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={{
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: colors.accent.blueGlow,
        borderWidth: 1, borderColor: colors.accent.blue + '30',
        alignItems: 'center', justifyContent: 'center', marginRight: 8,
      }}>
        <Text style={{ fontSize: 14 }}>⚡</Text>
      </View>
      <View style={{
        flexDirection: 'row',
        backgroundColor: colors.bg.surface,
        borderRadius: 16, borderBottomLeftRadius: 4,
        borderWidth: 1, borderColor: colors.border.default,
        padding: 14, gap: 6,
      }}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.text.muted, opacity: dot }} />
        ))}
      </View>
    </Animated.View>
  );
}

export default function ChatScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const pickerAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const {
    chatHistory,
    chatSessions,
    addChatMessage,
    startNewConversation,
    setWeeklyChallenge,
    addGoal,
    accounts,
    transactions,
    goals,
    subscriptions,
    healthScore,
    user,
    persona,
    setPersona,
  } = useAppStore();

  const hasMessages = chatHistory.length > 0;
  const handleSendRef = useRef<(text?: string) => void>(() => {});

  const generateId = useCallback(() =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    }), []);

  const openPersonaPicker = useCallback(() => {
    setShowPersonaPicker(true);
    Animated.spring(pickerAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
  }, [pickerAnim]);

  const closePersonaPicker = useCallback(() => {
    Animated.timing(pickerAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() =>
      setShowPersonaPicker(false)
    );
  }, [pickerAnim]);

  const handleSelectPersona = useCallback((id: PersonaId) => {
    setPersona(id);
    closePersonaPicker();
  }, [setPersona, closePersonaPicker]);

  // Start a fresh conversation each time this screen is focused
  useFocusEffect(
    useCallback(() => {
      startNewConversation();
    }, [startNewConversation])
  );

  useEffect(() => {
    if (route?.params?.preloadMessage) {
      handleSendRef.current(route.params.preloadMessage);
    }
  }, [route?.params?.preloadMessage]);

  const handleSend = async (text?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    setIsTyping(true);

    try {
      const response = await sendChatMessage(
        messageText,
        chatHistory,
        {
          accounts,
          monthlyIncome: user?.monthly_income ?? 0,
          allTransactions: transactions,
          goals,
          healthScore,
          subscriptions,
        },
        persona
      );

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.message,
        created_at: new Date().toISOString(),
        data_card: response.data_card,
        action_card: response.action_card,
      };
      addChatMessage(assistantMsg);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Please try again.',
        created_at: new Date().toISOString(),
      };
      addChatMessage(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  // Keep ref in sync so the preloadMessage effect always calls the latest version
  handleSendRef.current = handleSend;

  const handleAcceptChallenge = (card: ActionCard) => {
    setWeeklyChallenge({
      description: card.description || card.title,
      completed: false,
      opted_in: true,
    });
  };

  const handleAddToGoal = async (card: ActionCard) => {
    if (!card.goal_name || !card.amount) return;
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() + 6, 1)
      .toISOString()
      .split('T')[0];
    await addGoal({
      id: '',
      name: card.goal_name,
      target_amount: card.amount,
      current_amount: 0,
      target_date: targetDate,
      type: 'savings',
      created_at: today.toISOString(),
    });
  };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [chatHistory.length, isTyping]);

  const styles = makeChatStyles(colors);

  return (
    <View style={styles.container}>
      <DemoModeBanner />
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>⚡</Text>
        </View>
        <TouchableOpacity style={styles.headerPersonaPill} onPress={openPersonaPicker} activeOpacity={0.7}>
          <Text style={styles.headerPersonaEmoji}>
            {PERSONA_LIST.find((p) => p.id === persona)?.emoji ?? '📊'}
          </Text>
          <View style={styles.headerTextInner}>
            <Text style={styles.headerTitle}>
              {PERSONA_LIST.find((p) => p.id === persona)?.name ?? 'Financial Coach'}
            </Text>
            <Text style={styles.headerSub}>Tap to switch coach</Text>
          </View>
          <Text style={styles.headerChevron}>⌄</Text>
        </TouchableOpacity>
        {chatSessions.length > 0 && (
          <TouchableOpacity style={styles.historyButton} onPress={() => setShowHistory(true)}>
            <Text style={styles.historyIcon}>🕐</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Persona Picker Dropdown */}
      {showPersonaPicker && (
        <Modal transparent animationType="none" onRequestClose={closePersonaPicker}>
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={closePersonaPicker}>
            <Animated.View
              style={[
                styles.pickerSheet,
                {
                  opacity: pickerAnim,
                  transform: [{ translateY: pickerAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
                },
              ]}
            >
              <Text style={styles.pickerTitle}>Choose your coach</Text>
              {PERSONA_LIST.map((p) => {
                const active = p.id === persona;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.pickerRow, active && styles.pickerRowActive]}
                    onPress={() => handleSelectPersona(p.id as PersonaId)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerEmoji}>{p.emoji}</Text>
                    <View style={styles.pickerInfo}>
                      <Text style={[styles.pickerName, active && styles.pickerNameActive]}>{p.name}</Text>
                      <Text style={styles.pickerTagline}>{p.tagline}</Text>
                    </View>
                    {active && <Text style={styles.pickerCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* History Modal */}
      <Modal visible={showHistory} transparent animationType="slide" onRequestClose={() => { setShowHistory(false); setSelectedSession(null); }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setShowHistory(false); setSelectedSession(null); }}>
          <View
            style={styles.historySheet}
            onStartShouldSetResponder={() => true}
            // @ts-ignore
            onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            {selectedSession ? (
              <>
                <View style={styles.sheetTitleRow}>
                  <TouchableOpacity onPress={() => setSelectedSession(null)}>
                    <Text style={styles.backButton}>← Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.sheetTitle}>{format(new Date(selectedSession.startedAt), 'MMM d, yyyy')}</Text>
                  <View style={{ width: 60 }} />
                </View>
                <ScrollView style={styles.sessionScroll} showsVerticalScrollIndicator={false}>
                  {selectedSession.messages.map((msg) => (
                    <View key={msg.id} style={[styles.historyBubble, msg.role === 'user' ? styles.historyBubbleUser : styles.historyBubbleAI]}>
                      <Text style={[styles.historyBubbleText, msg.role === 'user' ? styles.historyBubbleTextUser : styles.historyBubbleTextAI]}>
                        {msg.content}
                      </Text>
                    </View>
                  ))}
                  <View style={{ height: 20 }} />
                </ScrollView>
              </>
            ) : (
              <>
                <Text style={styles.sheetTitle}>Chat History</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {chatSessions.map((session) => {
                    const preview = session.messages.find((m) => m.role === 'user')?.content ?? '';
                    return (
                      <TouchableOpacity key={session.id} style={styles.sessionRow} onPress={() => setSelectedSession(session)}>
                        <View style={styles.sessionInfo}>
                          <Text style={styles.sessionDate}>{format(new Date(session.startedAt), 'MMM d, yyyy · h:mm a')}</Text>
                          <Text style={styles.sessionPreview} numberOfLines={2}>{preview}</Text>
                        </View>
                        <Text style={styles.sessionCount}>{session.messages.length} msgs</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <View style={{ height: 20 }} />
                </ScrollView>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {!hasMessages && !isTyping ? (
          <ChatSuggestions onSelect={(text) => handleSend(text)} />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {chatHistory.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                onAcceptChallenge={handleAcceptChallenge}
                onAddToGoal={handleAddToGoal}
              />
            ))}
            {isTyping && <TypingIndicator />}
          </ScrollView>
        )}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask anything about your finances..."
            placeholderTextColor={colors.text.disabled}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            multiline
            onKeyPress={(e: any) => {
              if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                e.preventDefault?.();
                handleSend();
              }
            }}
          />
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim()}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeChatStyles(colors: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: 12,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent.blueGlow,
    borderWidth: 1,
    borderColor: colors.accent.blue + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 18,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },
  headerSub: {
    ...typography.caption,
    color: colors.text.muted,
  },
  historyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIcon: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  historySheet: {
    backgroundColor: colors.bg.elevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderBottomWidth: 0,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    ...typography.label,
    color: colors.accent.blue,
    fontWeight: '600',
    width: 60,
  },
  sessionScroll: {
    maxHeight: 400,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: 3,
  },
  sessionPreview: {
    ...typography.label,
    color: colors.text.primary,
  },
  sessionCount: {
    ...typography.caption,
    color: colors.text.disabled,
  },
  historyBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  historyBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent.blue,
    borderBottomRightRadius: 4,
  },
  historyBubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderBottomLeftRadius: 4,
  },
  historyBubbleText: {
    ...typography.body,
  },
  historyBubbleTextUser: {
    color: '#fff',
  },
  historyBubbleTextAI: {
    color: colors.text.primary,
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.bg.primary,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    ...typography.body,
    color: colors.text.primary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.bg.elevated,
  },
  sendIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },

  // ── Persona pill in header ──────────────────────────────────────────────────
  headerPersonaPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerPersonaEmoji: {
    fontSize: 18,
  },
  headerTextInner: {
    flex: 1,
  },
  headerChevron: {
    fontSize: 18,
    color: colors.text.muted,
    marginTop: -2,
  },

  // ── Persona picker dropdown ─────────────────────────────────────────────────
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: 70,
    paddingHorizontal: 16,
  },
  pickerSheet: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  pickerTitle: {
    ...typography.caption,
    color: colors.text.disabled,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderRadius: 10,
    marginHorizontal: 6,
  },
  pickerRowActive: {
    backgroundColor: colors.accent.blueGlow,
  },
  pickerEmoji: {
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  pickerInfo: {
    flex: 1,
  },
  pickerName: {
    ...typography.label,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  pickerNameActive: {
    color: colors.text.primary,
  },
  pickerTagline: {
    ...typography.caption,
    color: colors.text.disabled,
    marginTop: 1,
  },
  pickerCheck: {
    fontSize: 14,
    color: colors.accent.blue,
    fontWeight: '700',
  },
}); }
