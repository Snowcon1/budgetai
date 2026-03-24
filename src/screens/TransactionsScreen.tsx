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
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { Category, Transaction } from '../types';
import TransactionItem from '../components/TransactionItem';
import DemoModeBanner from '../components/DemoModeBanner';
import { allCategories } from '../constants/categories';

interface Props {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export default function TransactionsScreen({ navigation }: Props) {
  const { transactions, isDemo } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [refreshing, setRefreshing] = useState(false);

  const filteredGrouped = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    let filtered = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= monthStart && d <= monthEnd;
    });

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    const grouped = new Map<string, Transaction[]>();
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
  }, [transactions, selectedMonth, selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <DemoModeBanner onPress={() => navigation.navigate('Settings')} />

      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
          <Text style={styles.arrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>{format(selectedMonth, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={() => setSelectedMonth(addMonths(selectedMonth, 1))}>
          <Text style={styles.arrow}>→</Text>
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
          {allCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <SectionList
        sections={filteredGrouped}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accentBlue} />
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
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        }
        stickySectionHeadersEnabled={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ReceiptCapture')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.screenPadding,
    paddingVertical: 14,
  },
  arrow: {
    fontSize: theme.fontSize.xl,
    color: colors.accentBlue,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  monthText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterScroll: {
    paddingHorizontal: theme.screenPadding,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.accentBlue,
    borderColor: colors.accentBlue,
  },
  filterText: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: theme.screenPadding,
    paddingTop: 12,
    paddingBottom: 80,
  },
  dateHeader: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.accentBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 30,
  },
});
