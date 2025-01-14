import { defineStore } from 'pinia';
export const useUserStore = defineStore('user', {
    state: () => ({
        currentUser: null
    }),
    actions: {
        setCurrentUser(user) {
            this.currentUser = user;
        },
        clearCurrentUser() {
            this.currentUser = null;
        }
    }
});
