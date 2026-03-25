import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { format } from 'date-fns';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import DemoModeBanner from '../components/DemoModeBanner';
import { Account } from '../types';

interface Props {
  navigation: {
    getParent: () => { navigate: (screen: string) => void } | undefined;
  };
}

function accountIcon(type: Account['type']): string {
  if (type === 'checking') return '🏦';
  if (type === 'savings') return '💰';
  return '💳';
}

function fmt(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(n: number): string {
  return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function AccountsScreen({ navigation }: Props) {
  const { accounts, isDemo, userId, loadUserData } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const checking = accounts.filter((a) => a.type === 'checking');
  const savings = accounts.filter((a) => a.type === 'savings');
  const credit = accounts.filter((a) => a.type === 'credit');

  const totalChecking = checking.reduce((s, a) => s + a.balance, 0);
  const totalSavings = savings.reduce((s, a) => s + a.balance, 0);
  // Plaid returns credit card balances as positive numbers (amount owed)
  const totalCredit = credit.reduce((s, a) => s + Math.abs(a.balance), 0);
  const netWorth = totalChecking + totalSavings - totalCredit;
  const totalCash = totalChecking + totalSavings;

  const handleRefresh = async () => {
    if (!isDemo && userId) {
      setRefreshing(true);
      await loadUserData(userId);
      setRefreshing(false);
    }
  };

  const renderAccount = (account: Account) => {
    // Credit cards: positive balance = amount owed (debt) → show as negative/red
    const isDebt = account.type === 'credit' && account.balance > 0;
    const isNeg = account.balance < 0 || isDebt;
    const displayBalance = isDebt ? -Math.abs(account.balance) : account.balance;
    return (
      <View key={account.id} style={styles.accountCard}>
        <View style={styles.accountIconWrap}>
          <Text style={styles.accountIcon}>{accountIcon(account.type)}</Text>
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{account.name}</Text>
          <Text style={styles.accountMeta}>{account.institution}</Text>
          {account.last_synced ? (
            <Text style={styles.accountSync}>
              Updated {format(new Date(account.last_synced), 'MMM d, h:mm a')}
            </Text>
          ) : null}
        </View>
        <View style={styles.accountBalanceWrap}>
          <Text style={[styles.accountBalance, isNeg && styles.balanceRed]}>
            {isNeg ? '-' : ''}${fmt(displayBalance)}
          </Text>
          <View style={[styles.typeBadge, account.type === 'savings' && styles.badgeSavings, account.type === 'credit' && styles.badgeCredit]}>
            <Text style={[styles.typeBadgeText, account.type === 'savings' && styles.badgeSavingsText, account.type === 'credit' && styles.badgeCreditText]}>
              {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const sections: { label: string; accounts: Account[]; total: number; color: string }[] = [
    { label: 'CHECKING', accounts: checking, total: totalChecking, color: colors.accent.blue },
    { label: 'SAVINGS', accounts: savings, total: totalSavings, color: colors.accent.green },
    { label: 'CREDIT', accounts: credit, total: -totalCredit, color: colors.accent.red },
  ].filter((s) => s.accounts.length > 0);

  return (
    <View style={styles.container}>
      <DemoModeBanner />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.blue}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Accounts</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.getParent()?.navigate('Settings')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Net Worth Card */}
        <View style={styles.netWorthCard}>
          <Text style={styles.netWorthLabel}>Net Worth</Text>
          <Text style={[styles.netWorthValue, netWorth < 0 && styles.balanceRed]}>
            {netWorth < 0 ? '-' : ''}${fmt(netWorth)}
          </Text>
          <View style={styles.netBreakdownRow}>
            <View style={styles.netBreakdownItem}>
              <View style={[styles.netDot, { backgroundColor: colors.accent.green }]} />
              <View>
                <Text style={styles.netBreakdownLabel}>Cash</Text>
                <Text style={styles.netBreakdownValue}>${fmtShort(totalCash)}</Text>
              </View>
            </View>
            {totalCredit > 0 && (
              <>
                <View style={styles.netDivider} />
                <View style={styles.netBreakdownItem}>
                  <View style={[styles.netDot, { backgroundColor: colors.accent.red }]} />
                  <View>
                    <Text style={styles.netBreakdownLabel}>Debt</Text>
                    <Text style={[styles.netBreakdownValue, styles.balanceRed]}>-${fmtShort(totalCredit)}</Text>
                  </View>
                </View>
              </>
            )}
            {totalSavings > 0 && (
              <>
                <View style={styles.netDivider} />
                <View style={styles.netBreakdownItem}>
                  <View style={[styles.netDot, { backgroundColor: colors.accent.blue }]} />
                  <View>
                    <Text style={styles.netBreakdownLabel}>Saved</Text>
                    <Text style={styles.netBreakdownValue}>${fmtShort(totalSavings)}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏦</Text>
            <Text style={styles.emptyTitle}>No accounts connected</Text>
            <Text style={styles.emptyText}>
              {isDemo
                ? 'Connect your real bank accounts to track checking, savings, and credit balances in real time.'
                : 'Connect your bank accounts to track checking, savings, and credit balances in real time.'}
            </Text>
            {!isDemo && (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => navigation.getParent()?.navigate('PlaidConnectReal')}
              >
                <Text style={styles.connectButtonText}>+ Connect Bank Account</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {sections.map((section) => (
              <View key={section.label} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionLabelRow}>
                    <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
                    <Text style={styles.sectionTitle}>{section.label}</Text>
                  </View>
                  <Text style={[styles.sectionTotal, section.total < 0 && styles.balanceRed]}>
                    {section.total < 0 ? '-' : ''}${fmt(section.total)}
                  </Text>
                </View>
                <View style={styles.accountGroup}>
                  {section.accounts.map(renderAccount)}
                </View>
              </View>
            ))}

            {!isDemo && (
              <TouchableOpacity
                style={styles.addAccountRow}
                onPress={() => navigation.getParent()?.navigate('PlaidConnectReal')}
              >
                <Text style={styles.addAccountText}>+ Add Another Account</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  screenTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  settingsBtn: {
    padding: 4,
  },
  settingsIcon: {
    fontSize: 22,
  },

  // Net worth card
  netWorthCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: 24,
    marginBottom: 28,
    alignItems: 'center',
  },
  netWorthLabel: {
    ...typography.caption,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  netWorthValue: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -1,
    marginBottom: 20,
  },
  netBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  netBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  netDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  netBreakdownLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: 2,
  },
  netBreakdownValue: {
    ...typography.subheading,
    color: colors.text.primary,
    fontWeight: '600',
  },
  netDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.subtle,
  },
  balanceRed: {
    color: colors.accent.red,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionTotal: {
    ...typography.subheading,
    color: colors.text.primary,
    fontWeight: '600',
  },
  accountGroup: {
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },

  // Account card
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  accountIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountIcon: {
    fontSize: 20,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    ...typography.subheading,
    color: colors.text.primary,
    marginBottom: 2,
  },
  accountMeta: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: 2,
  },
  accountSync: {
    fontSize: 10,
    color: colors.text.disabled,
  },
  accountBalanceWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  accountBalance: {
    ...typography.subheading,
    fontWeight: '700',
    color: colors.text.primary,
  },
  typeBadge: {
    backgroundColor: colors.accent.blueGlow ?? colors.accent.blue + '20',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.accent.blue,
  },
  badgeSavings: {
    backgroundColor: colors.accent.greenGlow ?? colors.accent.green + '20',
  },
  badgeSavingsText: {
    color: colors.accent.green,
  },
  badgeCredit: {
    backgroundColor: colors.accent.redGlow ?? colors.accent.red + '20',
  },
  badgeCreditText: {
    color: colors.accent.red,
  },

  // Add account
  addAccountRow: {
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 14,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addAccountText: {
    ...typography.label,
    color: colors.accent.blue,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  connectButton: {
    backgroundColor: colors.accent.blue,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowColor: colors.accent.blue,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  connectButtonText: {
    color: '#fff',
    ...typography.label,
    fontWeight: '700',
  },
});
