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
import { theme } from '../constants/theme';
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

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      );
    animate(dot1, 0).start();
    animate(dot2, 200).start();
    animate(dot3, 400).start();
  }, []);

  return (
    <View style={typingStyles.container}>
      <View style={typingStyles.avatar}>
        <Text style={typingStyles.avatarText}>⚡</Text>
      </View>
      <View style={typingStyles.bubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[typingStyles.dot, { opacity: dot }]} />
        ))}
      </View>
    </View>
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
    backgroundColor: colors.accentBlue + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: { fontSize: 14 },
  bubble: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
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

  useEffect(() => {
    if (route?.params?.preloadMessage) {
      handleSend(route.params.preloadMessage);
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

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [chatHistory.length, isTyping]);

  return (
    <View style={styles.container}>
      <DemoModeBanner onPress={() => navigation.navigate('Settings')} />
      <View style={styles.header}>
        <Text style={styles.headerIcon}>⚡</Text>
        <Text style={styles.headerTitle}>Financial Coach</Text>
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
            placeholderTextColor={colors.textSecondary}
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
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.screenPadding,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chatContent: {
    paddingHorizontal: theme.screenPadding,
    paddingTop: 16,
    paddingBottom: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.screenPadding,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: theme.fontSize.md,
    color: colors.textPrimary,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  sendIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
});
