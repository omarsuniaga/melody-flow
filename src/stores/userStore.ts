import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const artistName = ref('');

  const setArtistName = (name: string) => {
    artistName.value = name;
  };

  return {
    artistName,
    setArtistName
  };
});
