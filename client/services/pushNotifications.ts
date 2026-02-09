interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string }>;
}

interface NotificationPreferences {
  enabled: boolean;
  wins: boolean;
  messages: boolean;
  promotions: boolean;
  tournaments: boolean;
  newGames: boolean;
  reminders: boolean;
}

class PushNotificationService {
  private permission: NotificationPermission = "default";
  private preferences: NotificationPreferences = {
    enabled: true,
    wins: true,
    messages: true,
    promotions: false,
    tournaments: true,
    newGames: true,
    reminders: true,
  };

  constructor() {
    this.loadPreferences();
    this.checkPermission();
  }

  /**
   * Check notification permission
   */
  async checkPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      console.log("Notifications not supported");
      return "denied";
    }

    this.permission = Notification.permission;
    return this.permission;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false;
    }

    if (this.permission === "granted") {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  /**
   * Send notification
   */
  async sendNotification(options: PushNotificationOptions): Promise<void> {
    if (!this.preferences.enabled || this.permission !== "granted") {
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || "🎰",
        badge: options.badge || "🎰",
        tag: options.tag || "coinkrazy-notification",
        requireInteraction: options.requireInteraction || false,
        actions: options.actions || [],
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  /**
   * Notify win
   */
  async notifyWin(
    gameId: string,
    amount: number,
    multiplier: number,
  ): Promise<void> {
    if (!this.preferences.wins) return;

    await this.sendNotification({
      title: "🎉 You Won!",
      body: `${amount} coins with ${multiplier}x multiplier!`,
      icon: "🎰",
      tag: "win-notification",
    });
  }

  /**
   * Notify jackpot
   */
  async notifyJackpot(gameId: string, amount: number): Promise<void> {
    await this.sendNotification({
      title: "🎊 JACKPOT! 🎊",
      body: `You won ${amount.toLocaleString()} coins!`,
      icon: "👑",
      tag: "jackpot-notification",
      requireInteraction: true,
    });
  }

  /**
   * Notify new message
   */
  async notifyMessage(fromUser: string): Promise<void> {
    if (!this.preferences.messages) return;

    await this.sendNotification({
      title: "New Message",
      body: `${fromUser} sent you a message`,
      icon: "💬",
      tag: "message-notification",
    });
  }

  /**
   * Notify tournament
   */
  async notifyTournament(tournamentName: string): Promise<void> {
    if (!this.preferences.tournaments) return;

    await this.sendNotification({
      title: "Tournament Starting",
      body: `${tournamentName} is now live!`,
      icon: "🏆",
      tag: "tournament-notification",
    });
  }

  /**
   * Notify new game
   */
  async notifyNewGame(gameName: string): Promise<void> {
    if (!this.preferences.newGames) return;

    await this.sendNotification({
      title: "New Game Available",
      body: `Check out ${gameName}!`,
      icon: "🎮",
      tag: "new-game-notification",
    });
  }

  /**
   * Notify promotion
   */
  async notifyPromotion(title: string, description: string): Promise<void> {
    if (!this.preferences.promotions) return;

    await this.sendNotification({
      title,
      body: description,
      icon: "🎁",
      tag: "promo-notification",
    });
  }

  /**
   * Notify reminder
   */
  async notifyReminder(message: string): Promise<void> {
    if (!this.preferences.reminders) return;

    await this.sendNotification({
      title: "Reminder",
      body: message,
      icon: "⏰",
      tag: "reminder-notification",
    });
  }

  /**
   * Update preferences
   */
  updatePreferences(prefs: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...prefs };
    this.savePreferences();
  }

  /**
   * Get preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    localStorage.setItem(
      "notificationPreferences",
      JSON.stringify(this.preferences),
    );
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): void {
    const saved = localStorage.getItem("notificationPreferences");
    if (saved) {
      try {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) };
      } catch (error) {
        console.error("Error loading notification preferences:", error);
      }
    }
  }

  /**
   * Schedule notification (for future use with service worker)
   */
  scheduleNotification(
    options: PushNotificationOptions,
    delayMs: number,
  ): NodeJS.Timeout {
    return setTimeout(() => {
      this.sendNotification(options);
    }, delayMs);
  }

  /**
   * Register service worker for push notifications
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!("serviceWorker" in navigator)) {
      console.log("Service Workers not supported");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered");
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  }
}

export const pushNotifications = new PushNotificationService();
export default pushNotifications;
