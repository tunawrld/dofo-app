import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { i18n } from '@/lib/i18n';


Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return false;
    }
    return true;
}

export async function schedulePushNotification(title: string, body: string, triggerDate: Date) {
    if (triggerDate.getTime() <= Date.now()) {
        return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: title,
            body: body,
            sound: 'default',
        },
        trigger: {
            date: triggerDate,
            type: Notifications.SchedulableTriggerInputTypes.DATE,
        },
    });
    return id;
}

export async function cancelNotification(id: string) {
    await Notifications.cancelScheduledNotificationAsync(id);
}

export async function manageDailyMotivationalReminder(hasPendingTasks: boolean) {
    const IDENTIFIER = 'daily-motivational';
    const t = (key: string) => i18n.t(key);

    if (hasPendingTasks) {
        const now = new Date();
        const triggerDate = new Date();
        triggerDate.setHours(19, 0, 0, 0); // 19:00

        if (triggerDate.getTime() > now.getTime()) {
            await Notifications.scheduleNotificationAsync({
                identifier: IDENTIFIER,
                content: {
                    title: t('premium.daily_notif_title'),
                    body: t('premium.daily_notif_body'),
                    sound: 'default',
                },
                trigger: {
                    date: triggerDate,
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                },
            });
        }
    } else {
        await Notifications.cancelScheduledNotificationAsync(IDENTIFIER);
    }
}

export async function manageWeeklyPlanningReminder() {
    const IDENTIFIER = 'weekly-planning';
    const t = (key: string) => i18n.t(key);

    // Check if already scheduled to avoid duplicates/overwrite calls unnecessarily
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const isScheduled = scheduled.some(notif => notif.identifier === IDENTIFIER);

    if (!isScheduled) {
        await Notifications.scheduleNotificationAsync({
            identifier: IDENTIFIER,
            content: {
                title: t('premium.weekly_notif_title'),
                body: t('premium.weekly_notif_body'),
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                weekday: 1, // Sunday (1 in Expo Calendar Trigger)
                hour: 19,   // 19:00
                minute: 0,
                repeats: true,
            },
        });
    }
}
