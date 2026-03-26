import * as Notifications from 'expo-notifications';
import { Goal } from '../types';
import { PersonaId, PERSONAS, DEFAULT_PERSONA } from '../constants/personas';
import { NotificationPrefs } from './notificationPrefs';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function scheduleWeeklyRecap(persona: PersonaId = DEFAULT_PERSONA): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('weekly-recap').catch(() => {});

  const { title, body } = PERSONAS[persona].notifications.weeklyRecap;

  await Notifications.scheduleNotificationAsync({
    identifier: 'weekly-recap',
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour: 19,
      minute: 0,
    },
  });
}

export async function scheduleGoalNudge(goal: Goal, persona: PersonaId = DEFAULT_PERSONA): Promise<void> {
  const identifier = `goal-nudge-${goal.id}`;
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

  const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
  const targetDate = new Date(goal.target_date);
  const now = new Date();
  const totalDays = (targetDate.getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now.getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const expectedProgress = totalDays > 0 ? elapsedDays / totalDays : 0;

  if (progress < expectedProgress * 0.8) {
    const { title, body } = PERSONAS[persona].notifications.goalNudge(goal.name);
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60 * 60 * 24 * 3,
        repeats: true,
      },
    });
  }
}

export async function scheduleBudgetWarning(currentSpend: number, monthlyIncome: number, persona: PersonaId = DEFAULT_PERSONA): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('budget-warning').catch(() => {});

  if (currentSpend >= monthlyIncome * 0.8) {
    const { title, body } = PERSONAS[persona].notifications.budgetWarning;
    await Notifications.scheduleNotificationAsync({
      identifier: 'budget-warning',
      content: { title, body },
      trigger: null,
    });
  }
}

export async function scheduleStreakReminder(
  persona: PersonaId = DEFAULT_PERSONA,
  hour = 20
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('streak-reminder').catch(() => {});

  const { title, body } = PERSONAS[persona].notifications.streakReminder;

  await Notifications.scheduleNotificationAsync({
    identifier: 'streak-reminder',
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
}

export async function scheduleDailyCheckIn(
  persona: PersonaId = DEFAULT_PERSONA,
  hour = 8
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('daily-checkin').catch(() => {});

  const personaData = PERSONAS[persona];
  const title = personaData.notifications.dailyCheckIn?.title ?? '📊 Daily Check-in';
  const body = personaData.notifications.dailyCheckIn?.body ?? 'Take a moment to log today\'s spending.';

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-checkin',
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
}

export async function scheduleAllNotifications(
  prefs: NotificationPrefs,
  persona: PersonaId,
  goals: Goal[],
  currentSpend: number,
  monthlyIncome: number
): Promise<void> {
  // Weekly recap
  if (prefs.weeklyRecap.enabled) {
    await Notifications.cancelScheduledNotificationAsync('weekly-recap').catch(() => {});
    const { title, body } = PERSONAS[persona].notifications.weeklyRecap;
    await Notifications.scheduleNotificationAsync({
      identifier: 'weekly-recap',
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: prefs.weeklyRecap.weekday,
        hour: prefs.weeklyRecap.hour,
        minute: 0,
      },
    });
  } else {
    await Notifications.cancelScheduledNotificationAsync('weekly-recap').catch(() => {});
  }

  // Streak reminder
  if (prefs.streakReminder.enabled) {
    await scheduleStreakReminder(persona, prefs.streakReminder.hour);
  } else {
    await Notifications.cancelScheduledNotificationAsync('streak-reminder').catch(() => {});
  }

  // Daily check-in
  if (prefs.dailyCheckIn.enabled) {
    await scheduleDailyCheckIn(persona, prefs.dailyCheckIn.hour);
  } else {
    await Notifications.cancelScheduledNotificationAsync('daily-checkin').catch(() => {});
  }

  // Budget warning
  if (prefs.budgetWarning.enabled) {
    await scheduleBudgetWarning(currentSpend, monthlyIncome, persona);
  } else {
    await Notifications.cancelScheduledNotificationAsync('budget-warning').catch(() => {});
  }

  // Goal nudges
  if (prefs.goalNudge.enabled) {
    for (const goal of goals) {
      await scheduleGoalNudge(goal, persona);
    }
  } else {
    for (const goal of goals) {
      await Notifications.cancelScheduledNotificationAsync(`goal-nudge-${goal.id}`).catch(() => {});
    }
  }
}
