import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pulse_notif_prefs';

export interface NotificationPrefs {
  weeklyRecap: { enabled: boolean; hour: number; weekday: number };
  goalNudge: { enabled: boolean };
  budgetWarning: { enabled: boolean };
  streakReminder: { enabled: boolean; hour: number };
  dailyCheckIn: { enabled: boolean; hour: number };
  milestoneAlerts: { enabled: boolean };
}

export const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
  weeklyRecap: { enabled: true, hour: 19, weekday: 1 },
  goalNudge: { enabled: true },
  budgetWarning: { enabled: true },
  streakReminder: { enabled: false, hour: 20 },
  dailyCheckIn: { enabled: false, hour: 8 },
  milestoneAlerts: { enabled: true },
};

export async function loadNotifPrefs(): Promise<NotificationPrefs> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY);
    if (!val) return DEFAULT_NOTIF_PREFS;
    const parsed = JSON.parse(val) as Partial<NotificationPrefs>;
    // Merge with defaults to handle new keys
    return {
      weeklyRecap: { ...DEFAULT_NOTIF_PREFS.weeklyRecap, ...parsed.weeklyRecap },
      goalNudge: { ...DEFAULT_NOTIF_PREFS.goalNudge, ...parsed.goalNudge },
      budgetWarning: { ...DEFAULT_NOTIF_PREFS.budgetWarning, ...parsed.budgetWarning },
      streakReminder: { ...DEFAULT_NOTIF_PREFS.streakReminder, ...parsed.streakReminder },
      dailyCheckIn: { ...DEFAULT_NOTIF_PREFS.dailyCheckIn, ...parsed.dailyCheckIn },
      milestoneAlerts: { ...DEFAULT_NOTIF_PREFS.milestoneAlerts, ...parsed.milestoneAlerts },
    };
  } catch {
    return DEFAULT_NOTIF_PREFS;
  }
}

export async function saveNotifPrefs(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => {});
}
