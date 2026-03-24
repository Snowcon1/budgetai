import * as Notifications from 'expo-notifications';
import { Goal } from '../types';

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

export async function scheduleWeeklyRecap(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('weekly-recap').catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: 'weekly-recap',
    content: {
      title: 'Weekly Spending Recap',
      body: 'Your weekly financial summary is ready. Tap to see how you did!',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour: 19,
      minute: 0,
    },
  });
}

export async function scheduleGoalNudge(goal: Goal): Promise<void> {
  const identifier = `goal-nudge-${goal.id}`;
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

  const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
  const targetDate = new Date(goal.target_date);
  const now = new Date();
  const totalDays = (targetDate.getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now.getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const expectedProgress = totalDays > 0 ? elapsedDays / totalDays : 0;

  if (progress < expectedProgress * 0.8) {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `${goal.name} needs attention`,
        body: `You're a bit behind on your ${goal.name} goal. A small contribution today can help!`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60 * 60 * 24 * 3,
        repeats: true,
      },
    });
  }
}

export async function scheduleBudgetWarning(currentSpend: number, monthlyIncome: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('budget-warning').catch(() => {});

  if (currentSpend >= monthlyIncome * 0.8) {
    await Notifications.scheduleNotificationAsync({
      identifier: 'budget-warning',
      content: {
        title: 'Budget Alert',
        body: "You've used over 80% of your estimated monthly budget. Consider slowing down on non-essentials.",
      },
      trigger: null,
    });
  }
}

export async function scheduleStreakReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('streak-reminder').catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: 'streak-reminder',
    content: {
      title: "Don't break your streak!",
      body: "You haven't logged any transactions in a few days. Keep your streak alive!",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60 * 24 * 5,
      repeats: false,
    },
  });
}
