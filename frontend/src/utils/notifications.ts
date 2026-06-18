export interface NotifSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const KEY = 'notifSettings';
let timerId: ReturnType<typeof setTimeout> | null = null;

export function loadNotifSettings(): NotifSettings {
  try {
    return { enabled: false, hour: 22, minute: 0, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { enabled: false, hour: 22, minute: 0 };
  }
}

export function saveNotifSettings(s: NotifSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
}

export function scheduleDaily(hour: number, minute: number): void {
  if (timerId !== null) clearTimeout(timerId);
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const ms = target.getTime() - now.getTime();
  timerId = setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('מעקב הוצאות 💰', {
        body: 'רשמת את כל ההוצאות של היום? 📝',
        icon: '/apple-touch-icon.png',
        tag: 'daily-reminder',
      });
    }
    scheduleDaily(hour, minute);
  }, ms);
}

export function cancelScheduled(): void {
  if (timerId !== null) { clearTimeout(timerId); timerId = null; }
}

export function initNotifications(): void {
  const { enabled, hour, minute } = loadNotifSettings();
  if (enabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    scheduleDaily(hour, minute);
  }
}
