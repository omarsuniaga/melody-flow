import { defineStore } from 'pinia';
export const useSettingsStore = defineStore('settings', {
    state: () => ({
        notificationSettings: {
            enabled: true,
            sound: true,
            vibration: true,
            screen: true,
            led: true,
            customAudioUrl: localStorage.getItem('customAudioUrl') || null,
            finalAlarmSound: '/audios/final-alarm.mp3',
            alertTimes: [
                { minutes: 360, type: 'early', enabled: true }, // 6 horas antes
                { minutes: 240, type: 'early', enabled: true }, // 4 horas antes
                { minutes: 120, type: 'early', enabled: true }, // 2 horas antes
                { minutes: 60, type: 'final', enabled: true } // 1 hora antes (alarma final)
            ],
            customAlertTimes: [],
            defaultFinalAlert: 60, // por defecto 1 hora
        }
    }),
    actions: {
        updateNotificationSettings(settings) {
            this.notificationSettings = { ...this.notificationSettings, ...settings };
        },
        setCustomAudioUrl(url) {
            this.notificationSettings.customAudioUrl = url;
            if (url) {
                localStorage.setItem('customAudioUrl', url);
            }
            else {
                localStorage.removeItem('customAudioUrl');
            }
        },
        addAlertTime(minutes) {
            if (!this.notificationSettings.alertTimes.some(alert => alert.minutes === minutes)) {
                this.notificationSettings.alertTimes.push({ minutes, type: 'standard', enabled: true });
                this.notificationSettings.alertTimes.sort((a, b) => b.minutes - a.minutes);
            }
        },
        removeAlertTime(minutes) {
            this.notificationSettings.alertTimes = this.notificationSettings.alertTimes
                .filter(alert => alert.minutes !== minutes);
        },
        setDefaultFinalAlert(minutes) {
            this.notificationSettings.defaultFinalAlert = minutes;
            this.updateAlertTimes();
        },
        addCustomAlertTime(hours) {
            const minutes = hours * 60;
            if (!this.notificationSettings.customAlertTimes.some(alert => alert.minutes === minutes)) {
                this.notificationSettings.customAlertTimes.push({
                    minutes,
                    type: 'early',
                    enabled: true
                });
                this.updateAlertTimes();
            }
        },
        removeCustomAlertTime(minutes) {
            this.notificationSettings.customAlertTimes =
                this.notificationSettings.customAlertTimes.filter(alert => alert.minutes !== minutes);
            this.updateAlertTimes();
        },
        updateAlertTimes() {
            const allAlerts = [
                ...this.notificationSettings.customAlertTimes,
                {
                    minutes: this.notificationSettings.defaultFinalAlert,
                    type: 'final',
                    enabled: true
                }
            ];
            this.notificationSettings.alertTimes = allAlerts.sort((a, b) => b.minutes - a.minutes);
        }
    }
});
