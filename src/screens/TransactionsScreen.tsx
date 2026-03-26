import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { Category, Transaction } from '../types';
import TransactionItem from '../components/TransactionItem';
import DemoModeBanner from '../components/DemoModeBanner';
import { allCategories, categoryEmojis } from '../constants/categories';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export default function TransactionsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { transactions, isDemo, syncPlaid, loadUserData, userId } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [refreshing, setRefreshing] = useState(false);

  const monthTransactions = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= monthStart && d <= monthEnd;
    });
  }, [transactions, selectedMonth]);

  const activeCategories = useMemo(() => {
    const cats = new Set(monthTransactions.map((t) => t.category));
    return allCategories.filter((c) => cats.has(c));
  }, [monthTransactions]);

  const filteredGrouped = useMemo(() => {
    let filtered = monthTransactions;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    const grouped = new Map<string, Transaction[]>();
    // Reset to 'All' if the selected category disappears in this month — handled by the chip list
    filtered.forEach((t) => {
      const dateKey = t.date;
      const existing = grouped.get(dateKey) ?? [];
      grouped.set(dateKey, [...existing, t]);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([date, data]) => ({
        title: format(new Date(date), 'EEEE, MMMM d'),
        data,
      }));
  }, [monthTransactions, selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (!isDemo && userId) {
      await syncPlaid();
    } else if (userId) {
      await loadUserData(userId);
    }
    setRefreshing(false);
  };

  const styles = makeTxnStyles(colors);

  return (
    <View style={styles.container}>
      <DemoModeBanner />

      <View style={styles.monthSelector}>
        <TouchableOpacity style={styles.arrowButton} onPress={() => { setSelectedMonth(subMonths(selectedMonth, 1)); setSelectedCategory('All'); }}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>{format(selectedMonth, 'MMMM yyyy')}</Text>
        <TouchableOpacity style={styles.arrowButton} onPress={() => { setSelectedMonth(addMonths(selectedMonth, 1)); setSelectedCategory('All'); }}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'All' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text style={[styles.filterText, selectedCategory === 'All' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {activeCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={styles.filterEmoji}>{categoryEmojis[cat]}</Text>
              <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <SectionList
        sections={filteredGrouped}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 90 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.blue} />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.dateHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>Try a different month or category</Text>
          </View>
        }
        stickySectionHeadersEnabled={false}
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        onPress={() => navigation.navigate('ReceiptCapture')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>📷</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeTxnStyles(colors: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  arrow: {
    fontSize: 22,
    color: colors.accent.blue,
    fontWeight: '600',
    lineHeight: 26,
  },
  monthText: {
    ...typography.heading,
    color: colors.text.primary,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: colors.accent.blue,
    borderColor: colors.accent.blue,
  },
  filterEmoji: {
    fontSize: 12,
  },
  filterText: {
    ...typography.label,
    color: colors.text.muted,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 90,
  },
  dateHeader: {
    ...typography.caption,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
  empty: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyText: {
    ...typography.subheading,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.muted,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent.blue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.accent.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  fabIcon: {
    fontSize: 24,
  },
}); }
