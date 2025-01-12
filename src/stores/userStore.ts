import { defineStore } from 'pinia'

interface UserState {
  currentUser: {
    uid?: string;
    email?: string;
  } | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: null
  }),

  actions: {
    setCurrentUser(user: UserState['currentUser']) {
      this.currentUser = user
    },

    clearCurrentUser() {
      this.currentUser = null
    }
  }
})
