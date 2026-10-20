import { ReminderSetting } from '../types/ibadat';
import { getRandomQuote } from '../data/hadithBank';

// Cordova plugin typing
declare global {
  interface Window {
    cordova?: {
      plugins?: {
        notification?: {
          local?: {
            hasPermission: (callback: (granted: boolean) => void) => void;
            requestPermission: (callback: (granted: boolean) => void) => void;
            schedule: (options: any | any[]) => void;
            cancel: (id: any | any[], callback?: () => void) => void;
            clear: (id: any | any[], callback?: () => void) => void;
            getAll: (callback: (notifications: any[]) => void) => void;
          };
        };
      };
    };
  }
}

// Memory of what was triggered today to prevent duplicate triggers
const triggeredKeysToday = new Set<string>();
let lastDayKey = "";
let lastHadithTimestamp = Date.now();
let lastGeneralTimestamp = Date.now();

// Convert activity key to a unique integer ID for Cordova Local Notifications
function hashKeyToNumber(key: string, index: number): number {
  let hash = 0;
  const str = `${key}_${index}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 1000000) + index * 10000;
}

export class NotificationService {
  /**
   * Check if Cordova Local Notification plugin is available
   */
  static isCordovaAvailable(): boolean {
    return Boolean(
      typeof window !== 'undefined' &&
      window.cordova?.plugins?.notification?.local
    );
  }

  /**
   * Check if Web Notification API is available
   */
  static isWebNotificationAvailable(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Request notification permission from Cordova or Browser
   */
  static async requestPermission(): Promise<boolean> {
    if (this.isCordovaAvailable()) {
      return new Promise<boolean>((resolve) => {
        window.cordova!.plugins!.notification!.local!.requestPermission((granted) => {
          resolve(Boolean(granted));
        });
      });
    }

    if (this.isWebNotificationAvailable()) {
      try {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Get current permission state
   */
  static getPermissionState(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (this.isCordovaAvailable()) {
      return 'granted'; // cordova will request when scheduled
    }
    if (this.isWebNotificationAvailable()) {
      return Notification.permission;
    }
    return 'unsupported';
  }

  /**
   * Play a pleasant melodic Islamic chime using Web Audio API
   */
  static playChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Triple chime: C5 -> E5 -> G5
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);

        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.65);
      });
    } catch (e) {
      console.warn("Chime audio failed", e);
    }
  }

  /**
   * Send an immediate notification (Web, Cordova, and Audio chime)
   */
  static sendNotification(title: string, body: string): void {
    // 1. Play audio chime
    this.playChime();

    // 2. Try Cordova Local Notification
    if (this.isCordovaAvailable()) {
      try {
        window.cordova!.plugins!.notification!.local!.schedule({
          id: Math.floor(Math.random() * 900000) + 100000,
          title,
          text: body,
          foreground: true,
          vibrate: true,
          sound: true
        });
      } catch (err) {
        console.warn("Cordova immediate notification failed", err);
      }
    }

    // 3. Try HTML5 Web Notification
    if (this.isWebNotificationAvailable() && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/app-icon.jpg',
          badge: '/app-icon.jpg',
          tag: 'ibadat-reminder'
        });
      } catch (err) {
        console.warn("Web Notification failed", err);
      }
    }
  }

  /**
   * Schedule native Cordova local notifications for an activity reminder
   */
  static scheduleCordovaReminders(setting: ReminderSetting): void {
    if (!this.isCordovaAvailable()) return;

    try {
      const [hourStr, minuteStr] = setting.start.split(':');
      const baseHour = parseInt(hourStr, 10) || 6;
      const baseMin = parseInt(minuteStr, 10) || 0;
      const notifications: any[] = [];

      for (let i = 0; i < setting.count; i++) {
        const triggerTime = new Date();
        triggerTime.setHours(baseHour);
        triggerTime.setMinutes(baseMin + i * setting.interval);
        triggerTime.setSeconds(0);
        triggerTime.setMilliseconds(0);

        // If time already passed today, schedule for tomorrow
        if (triggerTime.getTime() <= Date.now()) {
          triggerTime.setDate(triggerTime.getDate() + 1);
        }

        notifications.push({
          id: hashKeyToNumber(setting.key, i),
          title: `ইবাদত রিমাইন্ডার: ${setting.name}`,
          text: `${setting.name}-এর ওয়াক্ত/আমলের সময় হয়েছে (${i + 1}/${setting.count} বার)। ইবাদত সম্পন্ন করুন।`,
          trigger: {
            at: triggerTime,
            every: 'day' // repeats daily at this time in Cordova!
          },
          foreground: true,
          vibrate: true,
          sound: true
        });
      }

      window.cordova!.plugins!.notification!.local!.schedule(notifications);
    } catch (e) {
      console.warn("Failed scheduling Cordova notifications", e);
    }
  }

  /**
   * Cancel native Cordova notifications for an activity reminder
   */
  static cancelCordovaReminders(key: string, maxCount = 10): void {
    if (!this.isCordovaAvailable()) return;

    try {
      const ids: number[] = [];
      for (let i = 0; i < maxCount; i++) {
        ids.push(hashKeyToNumber(key, i));
      }
      window.cordova!.plugins!.notification!.local!.cancel(ids);
    } catch (e) {
      console.warn("Failed canceling Cordova notifications", e);
    }
  }

  /**
   * Reschedule all active reminders into Cordova (e.g. on app launch)
   */
  static syncAllCordovaReminders(reminders: Record<string, ReminderSetting>): void {
    if (!this.isCordovaAvailable()) return;
    Object.values(reminders).forEach((setting) => {
      this.scheduleCordovaReminders(setting);
    });
  }

  /**
   * Periodic scheduler that runs inside the app (every 15-30 seconds)
   * Checks for prayer/routine reminders, Auto Hadith, and General Reminders.
   */
  static checkTick(
    reminders: Record<string, ReminderSetting>,
    autoHadithEnabled: boolean,
    generalReminder: { enabled: boolean; interval: number },
    onInAppNotification: (title: string, message: string) => void
  ): void {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);

    // Reset daily trigger cache on new day
    if (lastDayKey !== todayKey) {
      triggeredKeysToday.clear();
      lastDayKey = todayKey;
    }

    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    // 1. Check Specific Activity Reminders
    Object.values(reminders).forEach((r) => {
      if (!r.start) return;
      const [hStr, mStr] = r.start.split(':');
      const startHour = parseInt(hStr, 10) || 0;
      const startMin = parseInt(mStr, 10) || 0;

      for (let i = 0; i < r.count; i++) {
        const totalMinutes = startHour * 60 + startMin + i * r.interval;
        const targetHour = Math.floor(totalMinutes / 60) % 24;
        const targetMin = totalMinutes % 60;

        if (currentHour === targetHour && currentMin === targetMin) {
          const triggerKey = `${todayKey}_${r.key}_${i}`;
          if (!triggeredKeysToday.has(triggerKey)) {
            triggeredKeysToday.add(triggerKey);

            const title = `⏰ ${r.name} এর রিমাইন্ডার`;
            const msg = `এখন ${r.name}-এর ওয়াক্ত/আমল করার সময় হয়েছে (${i + 1}/${r.count} বার)। আমলটি সম্পূর্ণ করুন।`;

            this.sendNotification(title, msg);
            onInAppNotification(title, msg);
          }
        }
      }
    });

    // 2. Check Auto Hadith (every 30 mins)
    if (autoHadithEnabled) {
      const elapsedMinutes = (Date.now() - lastHadithTimestamp) / (1000 * 60);
      if (elapsedMinutes >= 30) {
        lastHadithTimestamp = Date.now();
        const quote = getRandomQuote();
        const title = `📖 প্রতিদিনের হাদীস`;
        const msg = quote;
        this.sendNotification(title, msg);
        onInAppNotification(title, msg);
      }
    }

    // 3. Check General Tauba & Zikir Reminder
    if (generalReminder.enabled && generalReminder.interval > 0) {
      const elapsedMinutes = (Date.now() - lastGeneralTimestamp) / (1000 * 60);
      if (elapsedMinutes >= generalReminder.interval) {
        lastGeneralTimestamp = Date.now();
        const title = `📿 তাওবাহ ও যিকিরের রিমাইন্ডার`;
        const msg = `আসতাগফিরুল্লাহ, সুবহানাল্লাহ, আলহামদুলিল্লাহ, লা ইলাহা ইল্লাল্লাহ পাঠ করে অন্তরকে সতেজ করুন।`;
        this.sendNotification(title, msg);
        onInAppNotification(title, msg);
      }
    }
  }
}
