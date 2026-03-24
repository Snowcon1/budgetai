import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import ChatBubble from '../components/ChatBubble';
import ChatSuggestions from '../components/ChatSuggestions';
import DemoModeBanner from '../components/DemoModeBanner';
import { sendChatMessage } from '../lib/openai';
import { ChatMessage } from '../types';

interface Props {
  navigation: { navigate: (screen: string) => void };
  route?: { params?: { preloadMessage?: string } };
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 9 }),
    ]).start();

    // Animate dots
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
        typingStyles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={typingStyles.avatar}>
        <Text style={typingStyles.avatarText}>⚡</Text>
      </View>
      <View style={typingStyles.bubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[typingStyles.dot, { opacity: dot }]} />
        ))}
      </View>
    </Animated.View>
  );
}

const typingStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.blueGlow,
    borderWidth: 1,
    borderColor: colors.accent.blue + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: { fontSize: 14 },
  bubble: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: 14,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.text.muted,
  },
});

export default function ChatScreen({ navigation, route }: Props) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const {
    chatHistory,
    addChatMessage,
    isDemo,
    accounts,
    transactions,
    goals,
    subscriptions,
    healthScore,
    user,
  } = useAppStore();

  const hasMessages = chatHistory.length > 0;
  const handleSendRef = useRef<(text?: string) => void>(() => {});

  useEffect(() => {
    if (route?.params?.preloadMessage) {
      // Use ref to avoid stale closure
      handleSendRef.current(route.params.preloadMessage);
    }
  }, [route?.params?.preloadMessage]);

  const handleSend = async (text?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    setIsTyping(true);

    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthTxns = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const categoryTotals = new Map<string, number>();
      monthTxns
        .filter((t) => t.category !== 'Income')
        .forEach((t) => {
          const current = categoryTotals.get(t.category) ?? 0;
          categoryTotals.set(t.category, current + Math.abs(t.amount));
        });

      const topCategories = Array.from(categoryTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, total]) => ({ category, total }));

      const response = await sendChatMessage(
        messageText,
        chatHistory,
        {
          accounts,
          monthlyIncome: user?.monthly_income ?? 0,
          topCategories,
          goals,
          recentTransactions: transactions.slice(0, 10),
          healthScore,
          subscriptions,
        },
        isDemo
      );

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        created_at: new Date().toISOString(),
        data_card: response.data_card,
      };
      addChatMessage(assistantMsg);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
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

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [chatHistory.length, isTyping]);

  return (
    <View style={styles.container}>
      <DemoModeBanner />
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>⚡</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>Financial Coach</Text>
          <Text style={styles.headerSub}>Powered by GPT-4o</Text>
        </View>
      </View>
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
              <ChatBubble key={msg.id} message={msg} />
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

const styles = StyleSheet.create({
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
  headerTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },
  headerSub: {
    ...typography.caption,
    color: colors.text.muted,
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
});
